# Slim for the moment, we don't need node-gyp.
FROM library/node:7

# Defines our working directory in container
WORKDIR /usr/src/app

RUN apt-get update \
	&& apt-get install git \
	&& apt-get clean \
	&& mkdir bin build

# Copies the package.json first for better cache on later pushes
COPY package.json package.json

# This install npm dependencies on the resin.io build server,
# making sure to clean up the artifacts it creates in order to reduce the image size.
RUN JOBS=MAX \
	npm install --production --unsafe-perm \
	&& npm cache clean \
	&& rm -rf /tmp/*

# We only copy the actual code, none of the development or credential files.
# Everything else we need is from Envvars.
COPY bin ./bin
COPY build ./build

# server.js will run when container starts up on the device
ENTRYPOINT ["/usr/local/bin/node", "./bin/procbots"]
CMD ["-b", "versionbot"]

