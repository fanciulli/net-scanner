# Introduction

Net-scanner is a tool for scanning your home network in search for devices. The scan results are stored locally in a sqlite database which is used to compare results between runs. If a device is found on the database it is handled as existing or a possible update of information, otherwise it is considered to be a new device.

## Dependencies

### Node.js

net-scanner runs on node.js v22 LTS. It uses the sqlite module to store the scan results. 
Further details on sqlite can be found here: <https://nodejs.org/docs/latest-v22.x/api/sqlite.html>

In order to run net-scanner, the flag --experimental-sqlite shall be added.

### Nmap

nmap is being used to scan network and retrieve some information. Since we need to get MAC address from nmap, this needs to be run with root privileges. In order not to run node and net-scanner with root privileges we execute nmap with sudo (for Debian based linx distros).
In order not to enter password we have to perform a simple setup that allows nmap to run passwordless. 

In a terminal execute:

    sudo visudo -f /etc/sudoers.d/nmap

Fill in with the following line, replacing user, host and the nmap full path if needed:

    user host = (root) NOPASSWD: /usr/bin/nmap

Open a new terminal to fetch new settings. Running net-scanner will no more require to enter password.

## Configuration file

net-scanner requires a configuration file in order to properly work. Create a json file with the following fields:

| Field | Value | Description |
|-------|-------|-------------|
| target | IP address | IP address of the device or the network to scan (if netmask is specified) |
| netmask | Number | The optional netmask to trigger a subnet scan |
| logger | Object | The optional logger configuration. If no logger section is found net-scanner will use the console transport |
| transport | Enum | One of 'console' or 'slack', depending of the user choice. Console is the default choice |
| level | String | A log level for the logger |
| webhookUrl | URL | For Slack transport, the webhook URL to call. See <https://api.slack.com/messaging/webhooks> |
| channel | String | For Slack transport, the channel to post log line to |
| username | String | For Slack transport, the user that will post the log to the channel |
| icon_emoji | String | For Slack transport, the icon of the user |

Example configuration for scanning the network 192.168.0.0/24 and report the found devices to the Slack channel :

    {
        "target": "192.168.0.1",
        "netmask": 24,
        "logger": {
            "transport": "slack",
            "level": "info",
            "webhookUrl": "https://hooks.slack.com/services/xxxxxx/yyyyy",
            "channel": "#net-scanner",
            "username": "scanner",
            "icon_emoji": ":ghost:"
        }
    }

Example configuration for scanning the network 192.168.0.0/24 and report the found devices to the console:

    {
        "target": "192.168.0.1",
        "netmask": 24,
        "logger": {
            "transport": "console",
            "level": "info"
        }
    }





## How to run net-scanner

Checkout the source code and open a terminal on the project folder.

Run the following command to install dependencies:

    npm install

Create a configuration file (see configuration file section), e.g. config-scan.json

Run net-scanner as follows:

    node --experimental-sqlite index.mjs  -c config-scan.json