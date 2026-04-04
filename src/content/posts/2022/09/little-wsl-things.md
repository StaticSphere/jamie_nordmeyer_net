---
title: "Little WSL Things"
excerpt: "I just rebuilt my personal laptop and was trying to remember how I’d set up WSL the last time so that I could develop within…"
date: "2022-09-26T17:23:17"
author: "Jamie Nordmeyer"
featuredImage: "/wp-content/uploads/2021/10/pexels-olia-danilevich-4974915.jpg"
featuredImageAlt: ""
wpLink: "/2022/09/26/little-wsl-things/"
categories:
  - name: "Programming"
    slug: "programming"
  - name: "Visual Studio Code"
    slug: "visual-studio-code"
  - name: "Windows Subsystem for Linux"
    slug: "windows-subsystem-for-linux"
tags:
  - name: "asp.net"
    slug: "asp-net"
  - name: "vscode"
    slug: "vscode"
---

I recently rebuilt my personal laptop and was trying to remember how I had set up WSL last time so I could develop within WSL again. There were a couple of things I had not done previously, and I was determined to get them working this time around.

## Setting up the ASP.NET Developer Certificate

First, I wanted to set up a valid development certificate so that when I run my ASP.NET 6 API, the browser shows it as secure. Before my rebuild, this wasn’t working; the API ran fine, but the browser always showed the site as insecure.

It looks like.NET 6 automatically sets up the ASP.NET developer certificate during installation. When I ran `dotnet dev-certs`, it said the certificate already existed. Sure enough, when I navigated to `/usr/local/share/ca-certificates/aspnet` (I’m using Ubuntu on WSL), I could see both `https.crt` and `https.pfx`. However, when I launched the API and opened Swagger, the site still showed as unsecured.

What I ended up doing was opening Windows Certificate Manager outside WSL and installing the certificate from there. Open the Start Menu and search for `Manage User Certificates`. Once it opens, navigate to `Trusted Root Certification Authorities / Certificates`. Right-click the `Certificates` node, select `All Tasks`, then `Import...`. When prompted for the certificate location, navigate to `\\wsl.localhost\Ubuntu\usr\local\share\ca-certificates\aspnet`, then import `https.crt`.

In my case, I had to reboot my computer at that point. I’m not sure whether there’s a way to refresh everything without rebooting, but this worked for me. Launching the API now shows the site as secure.

## Ensuring That the Postgres Service is Running on WSL Startup

I didn’t want to manually start Postgres every time I restarted my computer, so I looked for a way to launch it automatically when opening a WSL terminal. That way it would already be running before I typed `code.`. I found the answer [here](https://www.wanzul.net/2021/07/03/making-postgresql-run-on-first-start-of-wsl-2-terminal/) by Wan Zulkarnain. Full credit to the original author. I’m copying it here for my own reference and in case that site ever goes down.

First, I added this code to my `~/.bashrc` file:

```bash
if ! pgrep -x "postgres" >/dev/null; then
    sudo pg_ctlcluster 12 main start
    echo "postgres service started using: sudo pg_ctlcluster 12 main start"
fi
```

I then created a `sudoers` file called `skip_sudo_pg` so I didn’t need to enter a password on each WSL startup. In that file, I added the following one-liner:

```text
%sudo   ALL=(ALL) NOPASSWD:/usr/bin/pg_ctlcluster
```

After stopping WSL and reopening a new terminal window, it successfully started up Postgres for me without me needing to manually do it.

It’s the little things that you come to appreciate… 😉
