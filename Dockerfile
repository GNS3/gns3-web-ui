# Dockerfile for GNS3 Web-ui development
FROM node:carbon

RUN npm -g config set user root
RUN npm install -g @angular/cli

# Create user
RUN useradd --user-group --create-home --shell /bin/false gns3-web-ui

# Create app directory
ENV HOME /home/gns3-web-ui
WORKDIR $HOME

# Switch to gns3-web-ui user
USER gns3-web-ui

# Copy source
COPY . .

# Install dependencies
RUN npm install

EXPOSE 8080

CMD ng serve --host 0.0.0.0 --port 8080
