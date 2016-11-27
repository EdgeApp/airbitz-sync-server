find /home/bitz/www/repos -maxdepth 2 -mindepth 2 | xargs -I {} bash -c 'echo {}; cd {}; (git gc || true)'
