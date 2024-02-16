---
layout: post
title:  "Introducing Module Federation"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

This is post 4 of 9 in the series

1. [Introduction]({{ site.baseurl }}/micro-frontend-journey-1)
2. [Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2)
3. [Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3)
4. **[Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4)**
5. [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5)
6. [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6)
7. [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7)
8. [Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8)
9. [Summary]({{ site.baseurl }}/micro-frontend-journey-9)

## Overview
As discussed in the previous article, the first step in updating our architecture involved the consolidation of our two repositories into one and the introduction of the NX framework. Once this phase was complete, I were ready to move to the next phase: the introduction of [module federation](https://webpack.js.org/concepts/module-federation/) for the purposes of breaking our Tenable.io application into a series of micro-apps.

![section-4-1.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-1.png)

## The Problem
Before I dive into what module federation is and why I used it, it’s important to first understand the problem I wanted to solve. As demonstrated in the following diagram, multiple teams were responsible for individual parts of the Tenable.io application. However, regardless of the update, everything went through the same build and deployment pipeline once the code was merged to master. This created a natural bottleneck where each team was reliant on any change made previously by another team.

![section-4-2.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-2.png)

This was problematic for a number of reasons:

- **Bugs** — Imagine your team needs to deploy an update to customers for your particular application as quickly as possible. However, another team introduced a relatively significant bug that should not be deployed to production. In this scenario, you either have to wait for the other team to fix the bug or release the code to production while knowingly introducing the bug. Neither of these are good options.
- **Slow to lint, test and build** — As discussed previously, as an application grows in size, things such as linting, testing, and building inevitably get slower as there is simply more code to deal with. This has a direct impact on your automation server/delivery pipeline (in our case Jenkins) because the pipeline will most likely get slower as your codebase grows.
- **E2E Testing Bottleneck** — End-to-end tests are an important part of an enterprise application to ensure bugs are caught before they make their way to production. However, running E2E tests for your entire application can cause a massive bottleneck in your pipeline as each build must wait on the previous build to finish before proceeding. Additionally, if one team’s E2E tests fail, it blocks the other team’s changes from making it to production. This was a significant bottleneck for us.

## The Solution
Let’s discuss why module federation was the solution for us. First, what exactly is module federation? In a nutshell, it is webpack’s way of implementing a micro-frontend (though it’s not limited to only implementing frontend systems). More specifically, it enables us to break apart our application into a series of smaller applications that can be developed and deployed individually, and then put back together into a single application. Let’s analyze how our deployment model above changes with this new approach.

As shown below, multiple teams were still responsible for individual parts of the Tenable.io application. However, you can see that each individual application within Tenable.io (the micro-apps) has its own Jenkins pipeline where it can lint, test, and build the code related to that individual application. But how do I know which micro-app was impacted by a given change? I rely on the NX framework discussed in the previous article. As a result of this new model, the bottleneck shown above is no longer an issue.

![section-4-3.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-3.png)

## Diving Deeper
Before You Proceed: The remainder of this article is very technical in nature and is geared towards engineers who wish to learn more about how module federation works and the way in which things can be set up. If you wish to see the code associated with the following section, you can check it out in [this branch](https://github.com/jablonnc/microfrontend-demo/tree/2-module-federation-setup).

Diagrams are great, but what does a system like this actually look like from a code perspective? I will build off the demo from the previous article to introduce module federation for the Tenable.io application.

#### Workspaces
One of the very first changes I made was to our NX workspaces. New workspaces are created via the [create-nx-workspace](https://nx.dev/nx-api/nx/documents/create-nx-workspace) command. For our purposes, the intent was to split up the Tenable.io application (previously its own workspace) into three individual micro-apps:

- **Host** — Think of this as the wrapper for the other micro-apps. Its primary purpose is to load in the micro-apps.
- **Application 1** — Previously, this was apps/tenable-io/src/app/app-1.tsx. I are now going to transform this into its own individual micro-app.
- **Application 2** — Previously, this was apps/tenable-io/src/app/app-2.tsx. I are now going to transform this into its own individual micro-app.
This simple diagram illustrates the relationship between the Host and micro-apps:

![section-4-4.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-4.png)

Let’s analyze a before and after of our workspace.json file that shows how the tenable-io workspace (line 5) was split into three (lines 4–6).

**Before (line 5)**

![section-4-5.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-5.png)

**After (lines 4–6)**

![section-4-6.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-6.png)

**Note:** When leveraging module federation, there are a number of different architectures you can leverage. In our case, a host application that loaded in the other micro-apps made the most sense for us. However, you should evaluate your needs and choose the one that’s best for you. [This article](https://rangle.io/blog/module-federation-federated-application-architectures) does a good job in breaking these options down.

#### Workspace Commands
Now that I have these three new workspaces, how exactly do I run them locally? If you look at the previous demo, you’ll see our serve command for the Tenable.io application leveraged the @nrwl/web:dev-server executor. Since we’re going to be creating a series of highly customized webpack configurations, I instead opted to leverage the @nrwl/workspace:run-commands executor. This allowed us to simply pass a series of terminal commands that get run. For this initial setup, we’re going to leverage a very simple approach to building and serving the three applications. As shown in the commands below, I simply change directories into each of these applications (via cd apps/…), and run the npm run dev command that is defined in each of the micro-app’s package.json file. This command starts the webpack dev server for each application.

![section-4-7.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-7.png)

![section-4-8.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-8.png)

At this point, if I run nx serve host (serve being one of the targets defined for the host workspace) it will kick off the three commands shown on lines 10–12. Later in the article, I will show a better way of managing multiple webpack configurations across your repository.

#### Webpack Configuration — Host
The following configuration shows a pretty bare bones implementation for our Host application. I have explained the various areas of the configuration and their purpose. If you are new to webpack, I recommend you read through their [getting started documentation](https://webpack.js.org/guides/getting-started/) to better understand how webpack works.

![section-4-9.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-9.png)

Some items of note include:

- **ModuleFederationPlugin** — This is what enables module federation. We’ll discuss some of the sub properties below.
- **remotes** — This is the primary difference between the host application and the applications it loads in (application 1 and 2). I define application1 and application2 here. This tells our host application that there are two remotes that exist and that can be loaded in.
- **shared** — One of the concepts you’ll need to get used to in module federation is the concept of sharing resources. Without this configuration, webpack will not share any code between the various micro-applications. This means that if application1 and application2 both import react, they each will use their own versions. Certain libraries (like the ones defined here) only allow you to load one version of the library for your application. This can cause your application to break if the library gets loaded in more than once. Therefore, I ensure these libraries are shared and only one version gets loaded in.
- **devServer** — Each of our applications has this configured, and it serves each of them on their own unique port. Note the addition of the Access-Control-Allow-Origin header: this is critical for dev mode to ensure the host application can access other ports that are running our micro-applications.

#### Webpack Configuration — Application

The configurations for application1 and application2 are nearly identical to the one above, with the exception of the ModuleFederationPlugin. Our applications are responsible for determining what they want to expose to the outside world. In our case, the exposes property of the ModuleFederationPlugin defines what is exposed to the Host application when it goes to import from either of these. This is the exposes property’s purpose: it defines a public API that determines which files are consumable. So in our case, I will only expose the index file (‘.’) in the src directory. You’ll see we’re not defining any remotes, and this is intentional. In our setup, I want to prevent micro-applications from importing resources from each other; if they need to share code, it should come from the libs directory.

![section-4-10.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-10.png)

In this demo, we’re keeping things as simple as possible. However, you can expose as much or as little as you want based on your needs. So if, for example, I wanted to expose an individual component, I could do that using the following syntax:

![section-4-12.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-11.png)

#### Initial Load
When I run nx serve host, what happens? The entry point for our host application is the index.js file shown below. This file imports another file called boostrap.js. This approach avoids the error “Shared module is not available for eager consumption,” which you can read more about [here](https://webpack.js.org/concepts/module-federation/#uncaught-error-shared-module-is-not-available-for-eager-consumption).

![section-4-12.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-12.png)

The bootstrap.js file is the real entry point for our Host application. I are able to import Application1 and Application2 and load them in like a normal component (lines 15–16):

![section-4-13.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-13.png)

**Note:** Had I exposed more specific files as discussed above, our import would be more granular in nature:

![section-4-14.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-14.png)

At this point, you might think we’re done. However, if you ran the application you would get the following error message, which tells us that the import on line 15 above isn’t working:

![section-4-15.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-15.png)

#### Loading The Remotes
To understand why this is, let’s take a look at what happens when I build application1 via the webpack-dev-server command. When this command runs, it actually serves this particular application on port 3001, and the entry point of the application is a file called remoteEntry.js. If I actually go to that port/file, we’ll see something that looks like this:

![section-4-16.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-16.png)

In the module federation world, application 1 & 2 are called remotes. According to their documentation, “Remote modules are modules that are not part of the current build and loaded from a so-called container at the runtime”. This is how module federation works under the hood, and is the means by which the Host can load in and interact with the micro-apps. Think of the remote entry file shown above as the public interface for Application1, and when another application loads in the remoteEntry file (in our case Host), it can now interact with Application1.

I know application 1 and 2 are getting built, and they’re being served up at ports 3001 and 3002. So why can’t the Host find them? The issue is because I haven’t actually done anything to load in those remote entry files. To make that happen, I have to open up the public/index.html file and add those remote entry files in:

![section-4-17.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-17.png)

![section-4-18.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-18.png)

Now if I run the host application and investigate the network traffic, we’ll see the remoteEntry.js file for both application 1 and 2 get loaded in via ports 3001 and 3002:

![section-4-19.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-4-19.png)

## Summary
At this point, I have covered a basic module federation setup. In the demo above, I have a Host application that is the main entry point for our application. It is responsible for loading in the other micro-apps (application 1 and 2). As I implemented this solution for our own application I learned a number of things along the way that would have been helpful to know from the beginning. See the following articles to learn more about the intricacies of using module federation:

- [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5) — How I dealt with managing an ever growing number of micro-apps and their associated configurations.
- [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6) — Learn the importance of sharing vendor code between your micro-apps.
- [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7) — Learn the importance of sharing your custom library code between your micro-apps.
