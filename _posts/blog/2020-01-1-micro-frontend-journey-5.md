---
layout: post
title:  "Module Federation — Managing Your Micro-Apps"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

This is post 5 of 9 in the series

1. [Introduction]({{ site.baseurl }}/micro-frontend-journey-1)
2. [Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2)
3. [Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3)
4. [Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4)
5. **[Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5)**
6. [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6)
7. [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7)
8. [Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8)
9. [Summary]({{ site.baseurl }}/micro-frontend-journey-9)

## Overview

![section-5-1.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-1.png)

## The Problem
When you first start using module federation and only have one or two micro-apps, managing the configurations for each app and the various ports they run on is simple.

![section-5-2.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-2.png)

As you progress and continue to add more micro-apps, you may start running into issues with managing all of these micro-apps. You will find yourself repeating the same configuration over and over again. You’ll also find that the Host application needs to know which micro-app is running on which port, and you’ll need to avoid serving a micro-app on a port already in use.

![section-5-3.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-3.png)

## The Solution
To reduce the complexity of managing these various micro-apps, I consolidated our configurations and the serve command (to spin up the micro-apps) into a central location within a newly created tools directory:

![section-5-4.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-4.png)

## Diving Deeper

**Before You Proceed:** The remainder of this article is very technical in nature and is geared towards engineers who wish to learn more about how I dealt with managing an ever growing number of micro-apps. If you wish to see the code associated with the following section, you can check it out in [this branch](https://github.com/jablonnc/microfrontend-demo/tree/3-module-federation-managing-micro-apps).

###### The Serve Command
One of the most important things I did here was create a serve.js file that allowed us to build/serve only those micro-apps an engineer needed to work on. This increased the speed at which our engineers got the application running, while also consuming as little local memory as possible. Below is a general breakdown of what that file does:

![section-5-5.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-5.png)

You can see in our webpack configuration below where I send the ready message (line 193). The serve command above listens for that message (line 26 above) and uses it to keep track of when a particular micro-app is done compiling.

![section-5-6.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-6.png)

###### Remote Utilities
Additionally, I created some remote utilities that allowed us to consistently manage our remotes. Specifically, it would return the name of the remotes along with the port they should run on. As you can see below, this logic is based on the workspace.json file. This was done so that if a new micro-app was added it would be automatically picked up without any additional configuration by the engineer.

![section-5-7.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-7.png)

###### Putting It All Together
Why was all this necessary? One of the powerful features of module federation is that all micro-apps are capable of being built independently. This was the purpose of the serve script shown above, i.e. it enabled us to spin up a series of micro-apps based on our needs. For example, with this logic in place, I could accommodate a host of various engineering needs:

- **Host only** — If I wanted to spin up the Host application I could run npm run serve (the command defaults to spinning up Host).
- **Host & Application1** — If I wanted to spin up both Host and Application1, I could run npm run serve --apps=application-1.
- **Application2 Only** — If I already had the Host and Application1 running, and I now wanted to spin up Application2 without having to rebuild things, I could run npm run serve --apps=application-2 --appOnly.
- **All** — If I wanted to spin up everything, I could run npm run serve --all.

You can easily imagine that as your application grows and your codebase gets larger and larger, this type of functionality can be extremely powerful since you only have to build the parts of the application related to what you’re working on. This allowed us to speed up our boot time by 2x and our rebuild time by 7x, which was a significant improvement.

**Note:** If you use Visual Studio, you can accomplish some of this same functionality through the [NX Console extension](https://marketplace.visualstudio.com/items?itemName=nrwl.angular-console).

###### Loading Your Micro-Apps — The Static Approach
In the previous article, when it came to importing and using Application 1 and 2, I simply imported the micro-apps at the top of the bootstrap file and hard coded the remote entries in the index.html file:

![section-5-8.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-8.png)

![section-5-9.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-9.png)

However in the real world, this is not the best approach. By taking this approach, the moment your application runs, it is forced to load in the remote entry files for every single micro-app. For a real world application that has many micro-apps, this means the performance of your initial load will most likely be impacted. Additionally, loading in all the micro-apps as we’re doing in the index.html file above is not very flexible. Imagine some of your micro-apps are behind feature flags that only certain customers can access. In this case, it would be much better if the micro-apps could be loaded in dynamically only when a particular route is hit.

In our initial approach with this new architecture, I made this mistake and paid for it from a performance perspective. I noticed that as I added more micro-apps, our initial load was getting slower. I finally discovered the issue was related to the fact that I were loading in our remotes using this static approach.

###### Loading Your Micro-Apps — The Dynamic Approach
Leveraging the remote utilities I discussed above, you can see how I pass the remotes and their associated ports in the webpack build via the REMOTE_INFO property. This global property will be accessed later on in our code when it’s time to load the micro-apps dynamically.

![section-5-10.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-10.png)

Once I had the necessary information I needed for the remotes (via the REMOTE_INFO variable), I then updated our bootstrap.jsx file to leverage a new component I discuss below called <MicroApp />. The purpose of this component was to dynamically attach the remote entry to the page and then initialize the micro-app lazily so it could be leveraged by Host. You can see the actual component never gets loaded until I hit a path where it is needed. This ensures that a given micro-app is never loaded in until it’s actually needed, leading to a huge boost in performance.

![section-5-11.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-11.png)

The actual logic of the <MicroApp /> component is highlighted below. This approach is a variation of the example [shown here](https://github.com/module-federation/module-federation-examples/blob/master/advanced-api/dynamic-remotes/app1/src/App.js). In a nutshell, this logic dynamically injects the <script src=”…remoteEntry.js”></script> tag into the index.html file when needed, and initializes the remote. Once initialized, the remote and any exposed component can be imported by the Host application like any other import.

![section-5-12.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-5-12.png)

## Summary

By making the changes above, I were able to significantly improve our overall performance. I did this by only loading in the code I needed for a given micro-app at the time it was needed (versus everything at once). Additionally, when our team added a new micro-app, our script was capable of handling it automatically. This approach allowed our teams to work more efficiently, and allowed us to significantly reduce the initial load time of our application. See the next article to learn about how I dealt with our vendor libraries.