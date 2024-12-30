# net-scanner

Tool for scanning your home network in search of intruders.

# NMAP

nmap is being used to scan network and retrieve some information. Since we need to get MAC address from nmap, this needs to be run with root privileges. In order not to run node and net-scanner with root privileges we execute nmap with sudo (for Debian based linx distros).
In order not to enter password we have to perform a simple setup that allows nmap to run passwordless. 

In a terminal execute:

    sudo visudo -f /etc/sudoers.d/nmap

Fill in with the following line, replacing user, host and the nmap full path if needed:

    user host = (root) NOPASSWD: /usr/bin/nmap

Open a new terminal to fetch new settings. Running net-scanner will no more require to enter password.