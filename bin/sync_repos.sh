find /home/bitz/www/repos -maxdepth 2 -mindepth 2 | xargs -I {} bash -c 'echo {}; cd {}; (sudo -u www-data ./hooks/post-receive && true)'
