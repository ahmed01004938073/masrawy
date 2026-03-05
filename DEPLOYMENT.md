# 🚀 دليل نشر مشروع Afleet - محدث ومكتمل

## ✅ المشروع جاهز للنشر! (Clever Cloud + MySQL)

### 🚀 نشر سريع على Clever Cloud:
1. قم بربط مستودع Git الخاص بك بـ Clever Cloud.
2. أضف "MySQL Add-on" للمنظمة الخاصة بك.
3. تأكد أن المتغيرات البيئية (`MYSQL_ADDON_HOST`, `MYSQL_ADDON_USER`, إلخ) تم حقنها تلقائياً.
4. السيرفر سيقوم تلقائياً بتنفيذ `npm start` من ملف `package.json` الرئيسي.

- 🏪 نظام إدارة شامل للمنتجات والطلبات
- 👥 إدارة الموظفين مع صلاحيات مخصصة
- 🚚 نظام الشحن والتوصيل المتكامل
- 📊 لوحة تحكم مع إحصائيات مفصلة
- 🔒 نظام أمان محسن مع Rate Limiting
- 📱 تصميم متجاوب لكل الشاشات
- 🏪 أيقونة المتجر في الصفحة الرئيسية
- ⚙️ إعدادات الموقع الشاملة

## 📋 متطلبات النشر

### System Requirements
- **Server:** VPS with minimum 2GB RAM, 2 CPU cores, 20GB storage
- **OS:** Ubuntu 20.04+ or CentOS 8+
- **Docker:** Version 20.10+
- **Docker Compose:** Version 2.0+
- **Domain:** Registered domain with DNS access
- **SSL Certificate:** Let's Encrypt or commercial certificate

### Required Software
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

## 🔧 Pre-Deployment Setup

### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git ufw fail2ban

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# Configure fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 2. Domain Configuration
- Point your domain A record to your server IP
- Configure subdomain for API: `api.yourdomain.com`
- Set up CDN subdomain: `cdn.yourdomain.com`

### 3. SSL Certificate Setup
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Create SSL directory
sudo mkdir -p /etc/nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /etc/nginx/ssl/afleetstore.crt
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /etc/nginx/ssl/afleetstore.key
```

## 🚀 Deployment Steps

### 1. Clone Repository
```bash
git clone https://github.com/yourusername/afleet-store.git
cd afleet-store
```

### 2. Environment Configuration
```bash
# Copy production environment file
cp .env.production .env

# Edit environment variables
nano .env

# Generate strong secrets
openssl rand -base64 32  # For JWT_SECRET
openssl rand -base64 32  # For ENCRYPTION_KEY
openssl rand -base64 32  # For DB_PASSWORD
```

### 3. Build and Deploy
```bash
# Make build script executable
chmod +x scripts/build-production.sh

# Run production build
./scripts/build-production.sh

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Database Setup
```bash
# Wait for database to be ready
docker-compose -f docker-compose.prod.yml exec afleet-database mysql -u root -p -e "SHOW DATABASES;"

# Import initial data (if available)
docker-compose -f docker-compose.prod.yml exec afleet-database mysql -u afleet_user -p afleet_store < database/schema.sql
```

### 5. Verify Deployment
```bash
# Check all services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test application
curl -I https://yourdomain.com
curl -I https://yourdomain.com/health
```

## 🔒 Security Hardening

### 1. Server Security
```bash
# Disable root login
sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sudo systemctl restart ssh

# Configure automatic updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 2. Database Security
```bash
# Secure MySQL installation
docker-compose -f docker-compose.prod.yml exec afleet-database mysql_secure_installation

# Create backup user
docker-compose -f docker-compose.prod.yml exec afleet-database mysql -u root -p -e "
CREATE USER 'backup'@'%' IDENTIFIED BY 'backup_password';
GRANT SELECT, LOCK TABLES ON afleet_store.* TO 'backup'@'%';
FLUSH PRIVILEGES;"
```

### 3. Application Security
```bash
# Set proper file permissions
sudo chown -R www-data:www-data /var/www/afleet-store
sudo chmod -R 755 /var/www/afleet-store

# Configure log rotation
sudo nano /etc/logrotate.d/afleet-store
```

## 📊 Monitoring Setup

### 1. Application Monitoring
```bash
# Access Grafana dashboard
https://yourdomain.com:3000
# Default login: admin / [GRAFANA_PASSWORD from .env]

# Access Prometheus
https://yourdomain.com:9090
```

### 2. Log Monitoring
```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f afleet-frontend

# View database logs
docker-compose -f docker-compose.prod.yml logs -f afleet-database

# View nginx logs
tail -f logs/nginx/access.log
tail -f logs/nginx/error.log
```

## 🔄 Backup Strategy

### 1. Automated Backups
```bash
# Database backup script is included in docker-compose
# Backups are stored in ./backups directory

# Manual backup
docker-compose -f docker-compose.prod.yml exec afleet-database mysqldump -u afleet_user -p afleet_store > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. File Backups
```bash
# Backup uploaded files
tar -czf files_backup_$(date +%Y%m%d).tar.gz uploads/

# Backup configuration
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env nginx.conf
```

## 🔄 Updates and Maintenance

### 1. Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and redeploy
./scripts/build-production.sh
docker-compose -f docker-compose.prod.yml up -d --build
```

### 2. SSL Certificate Renewal
```bash
# Renew certificates (automated with cron)
sudo certbot renew --dry-run

# Add to crontab
echo "0 12 * * * /usr/bin/certbot renew --quiet" | sudo crontab -
```

### 3. Database Maintenance
```bash
# Optimize database
docker-compose -f docker-compose.prod.yml exec afleet-database mysql -u root -p -e "OPTIMIZE TABLE afleet_store.*;"

# Check database size
docker-compose -f docker-compose.prod.yml exec afleet-database mysql -u root -p -e "
SELECT table_schema AS 'Database',
ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'afleet_store';"
```

## 🚨 Troubleshooting

### Common Issues

1. **Application won't start**
   ```bash
   # Check logs
   docker-compose -f docker-compose.prod.yml logs afleet-frontend
   
   # Check disk space
   df -h
   
   # Check memory usage
   free -h
   ```

2. **Database connection issues**
   ```bash
   # Test database connection
   docker-compose -f docker-compose.prod.yml exec afleet-backend nc -zv afleet-database 3306
   
   # Check database logs
   docker-compose -f docker-compose.prod.yml logs afleet-database
   ```

3. **SSL certificate issues**
   ```bash
   # Check certificate validity
   openssl x509 -in /etc/nginx/ssl/afleetstore.crt -text -noout
   
   # Test SSL configuration
   curl -I https://yourdomain.com
   ```

### Performance Issues
```bash
# Monitor resource usage
docker stats

# Check nginx performance
curl -w "@curl-format.txt" -o /dev/null -s https://yourdomain.com

# Database performance
docker-compose -f docker-compose.prod.yml exec afleet-database mysql -u root -p -e "SHOW PROCESSLIST;"
```

## 📞 Support

For deployment support:
- Email: support@afleetstore.com
- Documentation: https://docs.afleetstore.com
- Issues: https://github.com/yourusername/afleet-store/issues

## 🎯 Post-Deployment Checklist

- [ ] Application loads correctly
- [ ] SSL certificate is valid
- [ ] Database is accessible
- [ ] Backups are working
- [ ] Monitoring is active
- [ ] Security headers are set
- [ ] Performance is optimized
- [ ] Error tracking is enabled
- [ ] Analytics are working
- [ ] Email notifications work
