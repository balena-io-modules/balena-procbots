# Slim for the moment, we don't need node-gyp.
FROM library/node:7 AS base

RUN apt-get update \
	&& apt-get install git \
	&& apt-get clean

FROM base as build

# Defines our working directory in container
WORKDIR /usr/src/app

COPY . ./

# This install npm dependencies on the resin.io build server,
# making sure to clean up the artifacts it creates in order to reduce the image size.
RUN JOBS=MAX \
	npm install -q \
	&& npm cache clean --force \
	&& rm -rf /tmp/*

# Run test suite
RUN npm test

# Build the source files
RUN npm run build

FROM base as production

# Defines our working directory in container
WORKDIR /usr/src/app

# Copy across all the artifacts we need to run procbots
COPY --from=build /usr/src/app/package.json ./package.json
COPY --from=build /usr/src/app/bin ./bin
COPY --from=build /usr/src/app/build ./build
COPY --from=build /usr/src/app/node_modules ./node_modules

# server.js will run when container starts up on the device
ENTRYPOINT ["/usr/local/bin/node", "./bin/procbots"]
CMD ["-b", "versionbot"]
