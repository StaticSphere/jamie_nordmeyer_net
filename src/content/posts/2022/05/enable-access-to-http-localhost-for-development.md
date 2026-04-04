---
title: "Enable Access to http://localhost For Development"
excerpt: "I will forget this if I don’t get it written down, and I’m hoping that someone else will find this useful as well. If you’re…"
date: "2022-05-23T20:14:15"
author: "Jamie Nordmeyer"
featuredImage: "../../../../assets/images/2021/08/20210821_122534.jpg"
featuredImageAlt: ""
wpLink: "/2022/05/23/enable-access-to-http-localhost-for-development/"
categories:
  - name: "WebDev"
    slug: "webdev"
tags: []
---

I will forget this if I don’t get it written down, and I’m hoping that someone else will find this useful as well. If you’re having trouble accessing http://localhost from your development machine (for instance, http://locahost:4200 when starting an Angular application), you can do the following, at least for the Edge and Chrome browsers.

Open your Edge or Chrome browser, and go to edge://net-internals/#hsts or chrome://net-internals/#hsts, as applicable. At the very bottom (at least at the time of this writing), you’ll find a section called `Delete domain security policies`. Here, enter `localhost` into the Domain box, then click on the Delete button. You should now be able to access localhost from http on your development machine.
