[![Build Status](https://travis-ci.org/sensorlab/SensorManagementSystem.svg?branch=master)](https://travis-ci.org/sensorlab/SensorManagementSystem)

SensorManagementSystem
======================

## Docker support
### 1. Build docker container yourself
    $ docker build -t videk .

### 2. Pull from Docker Hub
    $ docker pull sensorlab6/videk

### 3. Optionally create persistent data storage
    $ docker create --name datavidek videk

### 4. Run docker container
Forwarding docker port 80 (and 443 for HTTPS) to your host port. Optionally
using data container, host SSH key and domain name setup. If WS address is
not the same as domain use WS and optionally use HTTPS. Rundeck password
should also be changed and ansible user set. Optionally you can setup github
webhook port and tokens. GITHUB_TOKEN is used to push build results to github
release and SECRET_TOKEN is secret which is shared with each webhook request.
Finally set your gmail account to send monitoring alerts.

    $ docker run -p 80:80 (-p 443:443) --volumes-from datavidek \  
    --volume $SSH_AUTH_SOCK:/ssh-agent \  
    -e SSH_AUTH_SOCK=/ssh-agent \  
    -e DOMAIN=example.com \  
    -e WS=ws.example.com \  
    -e HTTPS=true \  
    -e RUNDECKP=secret \  
    -e ANSIBLE_USER=someone \  
    -e GITHUB_HOOK="8000" \  
    -e GITHUB_TOKEN="secret" \  
    -e SECRET_TOKEN="secret" \  
    -e EMAIL=example@gmail.com \  
    -e PASSWORD=secret videk \
    -e EXPERIMENT_CONTROLLER = 8001

#### Aditional features

Mosquitto MQTT broker password:

    $ MQTTP=secret

External Grafana service:

    $ GRAFANA=172.17.0.1:3000

## Installation in Linux
Installation was performed on Ubuntu 12.04 & Ubuntu 14.04 .

### Prerequisites  

SMS requires git, node.js, mongodb and npm.

#### 1. Install git
    $ sudo apt-get update
    $ sudo apt-get install git

#### 2. Install node.js

   We will cover two different methods of  how to install node.js. First is using a apt package manager and the second is using a PPA (personal package archive) .

##### Install the Distro-stable version

Install the Distro-stable version using apt package manager. This version of node.js is not the latest, but it should be stable.

    $ sudo apt-get update
    $ sudo apt-get install nodejs
    $ sudo apt-get install npm

##### Install using a PPA

Second method is to add PPA maintained by Chris Lea. This will give you more recent versions of node.js than the official repositories.

    $ sudo add-apt-repository ppa:chris-lea/node.js
    $ sudo apt-get update
    $ sudo apt-get install nodejs

##### Test node.js

    $ echo -e '// Call the console.log function.\nconsole.log("Hello World");' |  tee test_node.js
    $ node test_node.js

As result you should get  "Hello World" .

#### 3. Install MongoDB

Import the public key

    $ sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv 7F0CEB10

Create a list file for MongoDB

    $ echo 'deb http://downloads-distro.mongodb.org/repo/ubuntu-upstart dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list

Reload local package database

    $ sudo apt-get update

Install the MongoDB packages

    $ sudo apt-get install mongodb-org

Start the MongoDB

     $ sudo service mongod start

Complete manual on how to install MongoDB you can find on the link -
   http://docs.mongodb.org/manual/installation/


### Setup the SMS
To setup the SMS platform on your computer follow steps bellow.

#### 1. Fork and Clone SMS repository
- Fork the  repository on GitHub. This can be done by clicking on the fork button.
- Clone the repository to your computer (change _username_ with your Github user name).

        $ git clone git@github.com:username/SensorManagementSystem.git
        $ cd SensorManagementSystem

For the further steps we assume that your cursor is pointing to the _server_ directory, to do that type:

    $ cd server

#### 2. Install SMS dependencies
To install SMS dependencies using _npm_ package manager type:

    $ npm install

#### 3. Fill a database with the dummy data
To insert dummy data into your database type:

    $ node app.js fill_dummy_data

#### 4. Run the SMS
 To run SMS type:

    $ node app.js run

Now open your web browser and visit [http://localhost:3000](http://localhost:3000/), to login use u:_vik_  p:_vik_.
