---
title: "Sharing SSL Token between Windows and WSL"
excerpt: "With the introduction of the WSL (Windows Subsystem for Linux), Windows users now have the ability to switch back and forth between cmd.exe, PowerShell, and…"
date: "2018-09-18T12:19:46"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2018/09/18/sharing-ssl-token-between-windows-and-wsl/"
categories:
  - name: "Programming"
    slug: "programming"
  - name: "Windows Subsystem for Linux"
    slug: "windows-subsystem-for-linux"
tags:
  - name: "ssl"
    slug: "ssl"
  - name: "vscode"
    slug: "vscode"
  - name: "wsl"
    slug: "wsl"
---

With the introduction of the WSL (Windows Subsystem for Linux), Windows users now have the ability to switch back and forth between cmd.exe, PowerShell, and Bash (or not at all, of course) at will. That said, I’ve chosen to use the Bash shell as the terminal within VSCode.

And this all works fine… until you need to commit your code to a remote git repository. I have my github account set up to use SSH tokens for authentication, and had originally set up the token, via git-bash, on the Windows side. Now, I want to use the same SSH token in Bash. Since the Linux world and Windows world are mostly isolated from each other with WSL, I needed to figure out how to get them talking to the same tokens.

I tried copying the token over from the Windows.ssh folder to the Linux.ssh folder, but that didn’t work due to how the tokens are signed. I also tried just creating a brand new token in the Linux environment, but that also did not work. When I tried to push/pull code from the remote repository, it wouldn’t work.

In no way do I qualify myself as an expert Linux. I know how to use the **ls** command, and the **nano** text editor. Full stop. So I needed a little help from our friend Google. Here’s the process that I used to get this all working.

First, I wanted to share the.ssh token between both Windows and Linux. Since, at the end off the day, the Linux runtime is running in a set of folders deep in the Windows folder hierarchy, this SHOULDN’T be a problem. So, I created a symbolic link. On Linux, the.ssh folder is typically located directly under root: ~/.ssh. I renamed this directory to ~/.ssh\_old (so I didn’t lose anything that was already in there), then ran the following command to create the symbolic link: **
ln -s /mnt/c/Users/{myusername}/.ssh **~/.ssh****
I found the information to do this here: [https://baptiste-wicht.com/posts/2012/09/linux-symbolic-links-hard-links.html](https://baptiste-wicht.com/posts/2012/09/linux-symbolic-links-hard-links.html)

Now, when I open bash, and try to do a git pull, I got something similar to the following error:

```text
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @
@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@
Permissions 0777 for 'privkey.pem' are too open.
It is required that your private key files are NOT accessible by others.
This private key will be ignored.
Load key "privkey.pem": bad permissions
Permission denied (publickey).
```

This happened because Windows does not support (go figure) Linux permissions, and Bash sees the permissions on the SSH token to be too open, making it insecure. They default to 777 which I believe means “anyone can do anything with this file anywhere, anytime”. I found the answer to this issue in a pair of search results.

First, you need to “turn on” the ability for WSL to track Linux style permissions. You can do that by creating the /etc/wsl.conf file, and adding an automount setting, as described here: [https://superuser.com/a/1343737](https://superuser.com/a/1343737). Second, you need to set the permissions of the SSH token to 600, as described here: [https://superuser.com/a/215506.](https://superuser.com/a/215506) To do this, cd into the ~/.ssh directory, then run the following command: **chmod 600 id\_rsa**. That will secure the token down with proper Linux permissions.

The benefit of this work is that now the same SSH token can be used regardless of whether you’re running in cmd.exe, PowerShell, or from Bash. I tested this out, and was able to do a git pull from all 3 of these environments.

I’m always learning, though. If you have a better way to do this, please let me know in the comments, and I’ll adjust my strategy accordingly!
