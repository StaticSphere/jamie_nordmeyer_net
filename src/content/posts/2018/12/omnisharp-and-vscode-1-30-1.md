---
title: "OmniSharp and VSCode 1.30.1"
excerpt: "I’m not seeing any hits on the Googles yet for this, but yesterday I ran into an issue where my OmniSharp (the official C# plugin…"
date: "2018-12-20T08:40:33"
author: "Jamie Nordmeyer"
featuredImage: null
featuredImageAlt: ""
wpLink: "/2018/12/20/omnisharp-and-vscode-1-30-1/"
categories:
  - name: "C#"
    slug: "c-sharp"
  - name: "Visual Studio Code"
    slug: "visual-studio-code"
tags:
  - name: "vscode"
    slug: "vscode"
---

I’m not seeing any hits on the Googles yet for this, but yesterday I ran into an issue where my OmniSharp (the official C# plugin for Visual Studio Code) extension was refusing to load properly. I uninstalled the extension, restarted VSCode, then reinstalled it, and restarted VSCode again. But no joy. When VSCode launches with the extension enabled, the OmniSharp Log simply says “Access is denied”.

I managed to get it working today. I had to uninstall the extension as I had yesterday. However, I ALSO had to physically remove the extension folder, which on Windows, is located in C:\\Users\\{USER}\\.vscode\\extensions\\ms-vscode.csharp-1.17.1. After deleting the ms-vscode-csharp-1.17.1 folder, then reinstalling the OmniSharp extension, everything is working again.

It seems as though something got corrupted in the original installation of the extension. Unfortunately, I have no logs. There’s nothing in the Windows Event Logs, and it didn’t occur to me until I’d fixed the issue that I should have opened the Chrome Developer tools in VSCode. Hopefully if someone else stumbles across this situation, they can open the Developer tools and give a little more insight into the issue.
