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


FILE_DIR = os.path.dirname(os.path.realpath(__file__))
WORKING_DIR = os.path.join(FILE_DIR, 'tmp')

SOURCE_ZIP = os.path.join(WORKING_DIR, 'gns3-server.source.zip')
SOURCE_DESTINATION = os.path.join(WORKING_DIR, 'source')
BINARIES_EXTENSION = platform.system() == "Windows" and ".exe" or ""


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


def download_dependencies_command(arguments):
    output_directory = os.path.join(os.getcwd(), arguments.b)

    # download ubridge
    url = 'https://api.github.com/repos/GNS3/ubridge/releases'
    response = requests.get(url)
    response.raise_for_status()
    releases = response.json()
    last_release = releases[0]
    
    # on Windows download cygwin1.dll and ubridge.exe
    if platform.system() == "Windows":
        ubridge_dir = os.path.join(output_directory, 'ubridge')
        os.makedirs(ubridge_dir, exist_ok=True)

        cygwin_file = os.path.join(ubridge_dir, 'cygwin1.dll')
        cygwin_url = list(filter(lambda x: x['name'] == 'cygwin1.dll', last_release['assets']))[0]['url']
        download(cygwin_url, cygwin_file)
        print('Downloaded cygwin1.dll to {}'.format(cygwin_file))

        ubridge_file = os.path.join(ubridge_dir, 'ubridge.exe')
        ubridge_url = list(filter(lambda x: x['name'] == 'ubridge.exe', last_release['assets']))[0]['url']
        download(ubridge_url, ubridge_file)
        print('Downloaded ubridge.exe to {}'.format(ubridge_file))

def download_command(arguments):
    shutil.rmtree(SOURCE_DESTINATION, ignore_errors=True)
    os.makedirs(SOURCE_DESTINATION)

    download("https://github.com/GNS3/gns3-server/archive/2.2.zip", SOURCE_ZIP)

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

