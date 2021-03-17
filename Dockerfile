FROM ubuntu:focal

LABEL Maintainer="Matevz Vucnik <matevz.vucnik@ijs.si>"
LABEL Description="This image is used to bootstrap Videk with all dependences"
LABEL Vendor="JSI"
LABEL Version="2.0"

# update packages and install some commons
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Europe/Ljubljana
RUN apt-get update --fix-missing
RUN apt-get upgrade -y
RUN apt-get install -y apt-utils
RUN apt-get install -y supervisor
RUN apt-get install -y rsync
RUN apt-get install -y vim
RUN apt-get install -y git
RUN apt-get install -y wget
RUN apt-get install -y cron
RUN apt-get install -y python-is-python2
RUN apt-get install -y software-properties-common
RUN apt-get install -y python3-certbot-nginx

# install nodejs an npm
RUN apt-get install -y nodejs
RUN apt-get install -y npm

# install mongodb
RUN apt-get install -y mongodb
RUN mkdir -p /data/db

# install nginx
RUN apt-get install -y nginx
RUN apt-get install -y spawn-fcgi
RUN rm /etc/nginx/sites-enabled/default
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf

# install munin
RUN apt-get install -y munin
RUN sed -e '/background 1/ s/^#*/# /' -i /etc/munin/munin-node.conf
RUN sed -i 's/^\(setsid \).*/\10/' /etc/munin/munin-node.conf
RUN mkdir -p /var/run/munin
RUN chown munin /var/run/munin
RUN chmod 755 /var/run/munin
RUN mkdir -p /var/cache/munin/www
RUN chown munin /var/cache/munin/www
RUN chmod 755 /var/cache/munin/www
RUN mkdir -p /var/lib/munin
RUN chown munin /var/lib/munin
RUN chmod 755 /var/lib/munin
COPY docker/munin/munin.conf /etc/munin/munin.conf

# install email support and setup munin alert
RUN apt-get install -y msmtp-mta
RUN apt-get install -y mailutils
COPY docker/munin/msmtprc /etc/msmtprc

# install ansible
RUN apt-get install -y ansible
COPY docker/ansible/hosts /etc/ansible/hosts

# install rundeck
RUN apt-get install -y expect
RUN apt-get install -y uuid-runtime
RUN apt-get install -y openjdk-8-jdk
RUN wget -O /tmp/rundeck.deb https://dl.bintray.com/rundeck/rundeck-deb/\
rundeck_3.3.2.20200817-1_all.deb
RUN dpkg -i /tmp/rundeck.deb
COPY docker/rundeck/rundeck-config.properties \
/etc/rundeck/rundeck-config.properties
COPY docker/rundeck/profile /etc/rundeck/profile
COPY docker/rundeck/rundeckd /root/rundeck/rundeckd
COPY docker/rundeck/rundeckpass /root/rundeck/rundeckpass

# install Videk cron to sync hosts
RUN apt-get install -y curl
RUN cd /root && \
git clone https://github.com/matevzv/videk-hosts.git
RUN touch /etc/cron.d/videk-hosts
RUN echo "*/5 * * * * root /usr/bin/python3 /root/videk-hosts/videk-hosts.py" \
>> /etc/cron.d/videk-hosts
RUN touch /etc/cron.d/videk-ping
RUN echo "*/10 * * * * root /root/videk-hosts/videk-ping.sh" \
>> /etc/cron.d/videk-ping

# install Videk CI
RUN apt-get install -y zip
RUN apt-get install -y make
RUN cd /root && \
git clone https://github.com/matevzv/videk-ci.git

# Install Experiment Controller tool
RUN apt-get install -y python3-pip \
    && pip3 install flask flask-socketio pyzmq eventlet gunicorn
RUN cd /root && \
git clone --single-branch --branch develop/grega https://github.com/logatec3/logatec-experiment.git
# TODO: Change the branch name, when it is deployed on master branch 

# install Jenkins
RUN wget -q -O - https://pkg.jenkins.io/debian-stable/jenkins.io.key | \
apt-key add -
RUN sh -c 'echo deb http://pkg.jenkins.io/debian-stable binary/ > \
/etc/apt/sources.list.d/jenkins.list'
RUN apt-get update && apt-get install -y \
  jenkins \
&& rm -rf /var/lib/apt/lists/*
ENV JENKINS_HOME /var/lib/jenkins

# install Mosquitto mqtt broker
RUN apt-get update && apt-get install -y \
  mosquitto \
  mosquitto-clients \
&& rm -rf /var/lib/apt/lists/*
COPY docker/mosquitto/videk.conf /etc/mosquitto/conf.d

# install Videk master from github
# TODO: Change repo back to sensorlab master branch when deployed
RUN cd /root && \
git clone --branch experiment-monitor https://github.com/9morano/SensorManagementSystem.git
WORKDIR /root/SensorManagementSystem
RUN npm install
RUN /usr/bin/mongod --fork --logpath /var/log/mongodb.log --dbpath \
/data/db && nodejs app.js init -y && /usr/bin/mongod --shutdown

# ssh setup
RUN mkdir -p /root/.ssh
RUN chmod 700 /root/.ssh
RUN touch /root/.ssh/config
RUN echo "Host *" >> /root/.ssh/config
RUN echo "    StrictHostKeyChecking no" >> /root/.ssh/config

# volumes
VOLUME ["/data/db", "/etc/munin", "/var/lib/munin", "/var/cache/munin/www", \
"/etc/ansible", "/etc/rundeck", "/var/rundeck", "/var/lib/rundeck", \
"/etc/letsencrypt", "/var/lib/jenkins"]

COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/start.sh /root/start.sh
RUN chmod 755 /root/start.sh

ENTRYPOINT ["/root/start.sh"]
