#!/bin/bash
# Install TPM PIN login (pinpam) — Josh Nexx system
set -euo pipefail

PINPAM_SRC="${1:-/home/nexx/pinpam/target/release}"
SEC="/lib/x86_64-linux-gnu/security"

sudo install -m 755 "$PINPAM_SRC/pinutil" /usr/local/bin/pinutil
sudo install -m 755 "$PINPAM_SRC/libpinpam.so" "$SEC/libpinpam.so"
sudo install -m 755 "$PINPAM_SRC/libpinpam_master_key.so" "$SEC/libpinpam_master_key.so"

sudo mkdir -p /etc/pinpam
sudo tee /etc/pinpam/policy >/dev/null <<'POLICY'
pin_min_length=4
pin_max_length=6
pin_lockout_max_attempts=5
pinutil_path=/usr/local/bin/pinutil
tcti=device:/dev/tpmrm0
POLICY
sudo chmod 644 /etc/pinpam/policy

sudo tee /etc/udev/rules.d/99-nexx-tpm.rules >/dev/null <<'UDEV'
KERNEL=="tpm[0-9]*", TAG+="systemd", MODE="0660", GROUP="tss"
KERNEL=="tpmrm[0-9]*", TAG+="systemd", MODE="0660", GROUP="tss"
UDEV
sudo udevadm control --reload-rules 2>/dev/null || true

sudo chgrp tss /usr/local/bin/pinutil
sudo chmod g+s /usr/local/bin/pinutil

# PAM: PIN is sufficient — password still works via common-auth
for f in gdm-password sudo su; do
  if [ -f "/etc/pam.d/$f" ] && ! grep -q libpinpam.so "/etc/pam.d/$f"; then
    sudo sed -i '/@include common-auth/i auth\tsufficient\tlibpinpam.so try_first_pass' "/etc/pam.d/$f"
  fi
done

# GNOME keyring unlock token for PIN logins
if [ -f /etc/pam.d/gdm-password ] && ! grep -q libpinpam_master_key.so /etc/pam.d/gdm-password; then
  sudo sed -i '/pam_gnome_keyring.so auto_start/i auth\toptional\tlibpinpam_master_key.so' /etc/pam.d/gdm-password
fi

echo "pinpam installed. Run: pinutil setup (as your user) to set PIN."