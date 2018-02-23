# Dockerfile for GNS3 Web-ui development
FROM node:carbon

# Create user
RUN useradd --user-group --create-home --shell /bin/false gns3-web-ui

# Create app directory
ENV HOME /home/gns3-web-ui
WORKDIR $HOME

# Copy source
COPY . .
RUN chown -R gns3-web-ui:gns3-web-ui $HOME

# Switch to gns3-web-ui user
USER gns3-web-ui

# Install dependencies
RUN yarn global add @angular/cli
RUN yarn install --pure-lockfile

ENV PATH /home/gns3-web-ui/.yarn/bin:$PATH

EXPOSE 8080

CMD ng serve --host 0.0.0.0 --port 8080
