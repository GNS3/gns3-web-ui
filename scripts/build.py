# -*- coding: utf-8 -*-
#
# Copyright (C) 2018 GNS3 Technologies Inc.
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

import os
import re
import sys
import json
import shutil
import psutil
import zipfile
import requests
import platform
import argparse
import subprocess

from multiprocessing import Process, Queue
from multiprocessing.queues import Empty

from cx_Freeze import setup, Executable

DEFAULT_GNS3_SERVER_DEV_BRANCH = '2.2'

FILE_DIR = os.path.dirname(os.path.realpath(__file__))
WORKING_DIR = os.path.join(FILE_DIR, 'tmp')

SOURCE_ZIP = os.path.join(WORKING_DIR, 'gns3-server.source.zip')
SOURCE_DESTINATION = os.path.join(WORKING_DIR, 'source')
BINARIES_EXTENSION = platform.system() == "Windows" and ".exe" or ""
DEPENDENCIES = {
    'ubridge': {
        'type': 'github',
        'releases': 'https://api.github.com/repos/GNS3/ubridge/releases',
        'version': '0.9.16', # possible to use LATEST as value
        'files': {
            'windows': [
                'cygwin1.dll',
                'ubridge.exe'
            ]
        }
    },
    'vpcs': {
        'type': 'github',
        'releases': 'https://api.github.com/repos/GNS3/vpcs/releases',
        'version': '0.6.2',
        'files': {
            'windows': [
                'cygwin1.dll',
                'vpcs.exe'
            ]
        }
    },
    'dynamips': {
        'type': 'github',
        'releases': 'https://api.github.com/repos/GNS3/dynamips/releases',
        'version': '0.2.17',
        'files': {
            'windows': [
                'cygwin1.dll',
                'dynamips.exe',
                'nvram_export.exe'
            ]
        }
    },
    'putty': {
        'type': 'http',
        'url': 'https://the.earth.li/~sgtatham/putty/{version}/w64/putty.exe',
        'version': '0.71',
        'files': {
            'windows': [
                'putty.exe',
            ]
        }
    }
}


def download(url, output):
    print("Downloading {} to {}".format(url, output))

    if os.path.exists(output):
        print("{} already exist skip downloading".format(output))
        return
    r = requests.get(url, stream=True)
    if r.status_code == 200:
        with open(output, 'wb') as f:
            for chunk in r.iter_content():
                f.write(chunk)
    else:
        print("Download error for {} status {}".format(url, r.status_code))
        sys.exit(1)


def unzip(filename, directory):
    zip = zipfile.ZipFile(filename, 'r')
    zip.extractall(directory)
    zip.close()
    return zip.filelist


def getversion(version):
    match = re.search("^(\d+\.\d+(.\d+)?).*$", version)
    assert match
    return match.group(1)


def getsource_directory():
    files = os.listdir(SOURCE_DESTINATION)
    if len(files) > 0:
        return os.path.join(SOURCE_DESTINATION, files[0])
    raise Exception("Cannot find sources for gns3server")


def prepare():
    os.makedirs(WORKING_DIR, exist_ok=True)


def download_from_github(name, definition, output_directory):
    response = requests.get(definition['releases'])
    response.raise_for_status()
    releases = response.json()

    if definition['version'] == 'LATEST':
        release = releases[0]
    else:
        release = list(filter(lambda x: x['tag_name'] == "v{}".format(definition['version']), releases))[0]

    dependency_dir = os.path.join(output_directory, name)
    os.makedirs(dependency_dir, exist_ok=True)

    files = []
    if platform.system() == "Windows":
        files = definition['files']['windows']
    
    for filename in files:
        dependency_file = os.path.join(dependency_dir, filename)
        dependency_url = list(filter(lambda x: x['name'] == filename, release['assets']))[0]['browser_download_url']
        download(dependency_url, dependency_file)
        print('Downloaded {} to {}'.format(filename, dependency_file))


def download_from_http(name, definition, output_directory):
    url = definition['url'].format(version=definition['version'])

    dependency_dir = os.path.join(output_directory, name)
    os.makedirs(dependency_dir, exist_ok=True)

    files = []
    if platform.system() == "Windows":
        files = definition['files']['windows']
    
    for filename in files:
        dependency_file = os.path.join(dependency_dir, filename)
        download(url, dependency_file)
        print('Downloaded {} to {}'.format(filename, dependency_file))


def download_dependencies_command(arguments):
    output_directory = os.path.join(os.getcwd(), arguments.b)

    for name, definition in DEPENDENCIES.items():
        if definition['type'] == 'github':
            download_from_github(name, definition, output_directory)
        if definition['type'] == 'http':
            download_from_http(name, definition, output_directory)


def get_latest_version():
    response = requests.get('https://api.github.com/repos/GNS3/gns3-server/releases')
    response.raise_for_status()
    releases = response.json()
    latest = list(filter(lambda r: r['tag_name'].startswith('v'.format(DEFAULT_GNS3_SERVER_DEV_BRANCH)), releases))[0]
    return latest['tag_name'].replace('v', '')


def is_tagged():
    if 'TRAVIS_TAG' in os.environ.keys():
      return True
    if 'CIRCLE_TAG' in os.environ.keys():
      return True
    if os.environ.get('APPVEYOR_REPO_TAG', False) in (1, "True", "true"):
      return True
    

def is_web_ui_non_dev():
    package_file = os.path.join(FILE_DIR, '..', 'package.json')
    with open(package_file) as fp:
      package_content = fp.read()
    package = json.loads(package_content)
    version = package['version']
    return not version.endswith('dev')


def auto_version(arguments):
    # if we are on tagged repo it means we should use released gns3server
    if is_tagged():
      arguments.l = True

    # if we are building non-dev version it should be same as above
    if is_web_ui_non_dev():
      arguments.l = True


def download_command(arguments):
    if arguments.a:
      auto_version(arguments)

    shutil.rmtree(SOURCE_DESTINATION, ignore_errors=True)
    os.makedirs(SOURCE_DESTINATION)

    if arguments.l:
      version = get_latest_version()
      download_url = "https://api.github.com/repos/GNS3/gns3-server/zipball/v{version}"
    else:
      version = DEFAULT_GNS3_SERVER_DEV_BRANCH
      download_url = "https://github.com/GNS3/gns3-server/archive/{version}.zip"

    print("Using {version} with download_url: {download_url}".format(version=version, download_url=download_url))

    download(download_url.format(version=version), SOURCE_ZIP)

    files = unzip(SOURCE_ZIP, SOURCE_DESTINATION)
    source_directory = os.path.join(SOURCE_DESTINATION, files[0].filename)

    if platform.system() == "Windows":
        requirements = 'win-requirements.txt'
    else:
        requirements = 'requirements.txt'

    subprocess.check_call([sys.executable, '-m', 'pip', 'install', '-r', os.path.join(source_directory, requirements)])


def build_command(arguments):
    source_directory = getsource_directory()

    sys.path.append(source_directory)

    if platform.system() == 'Darwin':
        # this fixes cx_freeze bug for OSX and python 3.6, see:
        # https://bitbucket.org/ronaldoussoren/pyobjc/issues/185/python-36-modulenotfounderror-no-module
        with open(os.path.join(source_directory, 'gns3server', 'main.py')) as f:
            main_content = f.read()

        if 'cx_freeze_and_python_3_6_missing_library' not in main_content:
            main_content += "\ndef cx_freeze_and_python_3_6_missing_library():\n    import _sysconfigdata_m_darwin_darwin\n\n"

        with open(os.path.join(source_directory, 'gns3server', 'main.py'), 'w') as f:
            f.write(main_content)

    from gns3server.version import __version__

    # cx_Freeze on Windows requires version to be in format a.b.c.d
    server_version = getversion(__version__)

    executables = [
        Executable(
            os.path.join(source_directory, "gns3server/main.py"),
            targetName="gns3server{}".format(BINARIES_EXTENSION)
        ),
        Executable(
            os.path.join(source_directory, "gns3server/utils/vmnet.py"),
            targetName="gns3vmnet{}".format(BINARIES_EXTENSION)
        )
    ]

    excludes = [
        "raven.deprecation",  # reported problem in raven package (6.4.0)
        "distutils",  # issue on macOS
        "tkinter",  # issue on Windows
    ]

    packages = [
        "raven",
        "psutil",
        "asyncio",
        "packaging",  # needed for linux
        "appdirs",
        "idna",  # required by aiohttp >= 2.3, cannot be found by cx_Freeze
    ]

    include_files = [
        ("gns3server/configs", "configs"),
        ("gns3server/appliances", "appliances"),
        ("gns3server/templates", "templates"),
        ("gns3server/symbols", "symbols"),
        ("gns3server/static/web-ui", "static/web-ui"),
        ("cacert.pem", "cacert.pem")
    ]

    include_files = [(os.path.join(source_directory, x), y) for x, y in include_files]

    setup(
        name="GNS3",
        version=server_version,
        description="GNS3 Network simulator",
        executables=executables,
        options={
            "build_exe": {
                "includes": [],
                "excludes": excludes,
                "packages": packages,
                "include_files": include_files
            },
        }
    )


def execute(exe, queue, pid_q):
    binary_process = subprocess.Popen(
      [exe],
      bufsize=1, shell=False,
      stdout=subprocess.PIPE, stderr=subprocess.STDOUT
    )

    pid_q.put(binary_process.pid)

    while True:
        out = binary_process.stdout.read(1)
        if out == b'' and binary_process.poll() is not None:
            break
        queue.put(out)


def validate_command(arguments):
    output_directory = os.path.join(os.getcwd(), arguments.b)
    files = os.listdir(output_directory)
    matching = [f for f in files if f.startswith('exe.')]
    if len(matching) == 0:
        raise Exception("Cannot find binaries of gns3server")
    binary = os.path.join(output_directory, matching[0], 'gns3server{}'.format(BINARIES_EXTENSION))

    print("Validating: {}".format(binary))

    pid_queue = Queue()
    output_queue = Queue()

    process = Process(target=execute, args=(binary, output_queue, pid_queue))
    process.start()

    pid = pid_queue.get()

    print("Process is running on pid: " + str(pid))

    output = ""
    while True:
        try:
            char = output_queue.get(timeout=3)
            output += char.decode()
        except Empty:
            break

    process.terminate()

    print("Output of process:")
    print(output)

    parent = psutil.Process(pid)
    parent.kill()

    result = "GNS3 Technologies Inc" not in output and 1 or 0
    sys.exit(result)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Building gns3server for distribution')

    subparsers = parser.add_subparsers(
        dest='command', help='Command which needs to be executed')

    parser_download = subparsers.add_parser(
        'download', help='Downloads source code of gns3server')
    parser_download.add_argument('-l', action='store_true', help="Use the latest released version (incl. alpha), if not specified then dev version will be taken.")
    parser_download.add_argument('-a', action='store_true', help="Automatically choose version based on CI/CD pipeline")


    parser_build = subparsers.add_parser('build_exe', help='Build gns3server')
    parser_build.add_argument('-b', help='Output directory')
    parser_build.add_argument('-s', action='store_true', help='Silient building')

    parser_validate = subparsers.add_parser('validate', help='Validate build')
    parser_validate.add_argument('-b', help='Output directory')

    parser_validate = subparsers.add_parser('download_dependencies', help='Download dependencies')
    parser_validate.add_argument('-b', help='Output directory')

    args = parser.parse_args()

    if args.command == 'build_exe':
        prepare()
        build_command(args)
    elif args.command == 'download':
        prepare()
        download_command(args)
    elif args.command == 'download_dependencies':
        prepare()
        download_dependencies_command(args)
    elif args.command == 'validate':
        prepare()
        validate_command(args)

