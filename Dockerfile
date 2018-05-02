from node:latest
label name="lerna/test-runner"
label maintainer="https://github.com/lerna/lerna"

copy . /opt/lerna
run apt remove -y git &&\
    echo "deb http://ppa.launchpad.net/git-core/ppa/ubuntu trusty  main" >> /etc/apt/sources.list &&\
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys A1715D88E1DF1F24 &&\
    apt update &&\
    apt install -y git &&\
    rm -rf /var/lib/apt/lists/*

workdir /opt/lerna
run npm install

cmd ["npm","test"]
    
