#!/bin/bash

while read $key; do
  sudo adduser $key
  sudo mkdir /home/$key/.ssh
  sudo chmod 754 /home/$key/.ssh
  sudo chown $key.$key /home/$key/.ssh
  sudo touch /home/$key/.ssh/authorized_keys
  sudo chmod 600 /home/$key/.ssh/authorized_keys
  sudo chown $key.$key /home/$key/.ssh/authorized_keys
  sudo vi /home/$key/.ssh/authorized_keys
  sudo gpasswd -a $key ssh
  sudo gpasswd -a $key sudo
done < $1