```
sudo apt update
sudo apt install nginx certbot python3-certbot-nginx -y
```
```
sudo ln -s /etc/nginx/sites-available/eagleeye /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```
