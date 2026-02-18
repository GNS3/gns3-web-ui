#!/bin/sh
#
# Copyright (C) 2018 GNS3 Technologies Inc.
# Copyright (C) 2018 Nabil Bendafi <nabil@bendafi.fr>
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

# A docker web UI use for localy test

docker build -t gns3-web-ui .
docker run -i -h gns3UIvm -p 8080:8080/tcp -t gns3-web-ui
