---
layout: post
title:  "Introducing the Monorepo & NX"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

This is post 3 of 9 in the series

1. [Introduction]({{ site.baseurl }}/micro-frontend-journey-1)
2. [Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2)
3. **[Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3)**
4. [Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4)
5. [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5)
6. [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6)
7. [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7)
8. [Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8)
9. [Summary]({{ site.baseurl }}/micro-frontend-journey-9)

## Overview
In this next phase of our journey, I created a monorepo built off the NX framework. The focus of this article is on how I leverage NX to identify which part of the repository changed, allowing us to only rebuild that portion. As discussed in the previous article, our teams were plagued by a series of issues that I believed could be solved by moving towards a new architecture. Before I dive into the first phase of this new architecture, let’s recap one of the issues I were facing and how I solved it during this first phase.

![section-3-1.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-1.png)

## The Problem
Our global components lived in an entirely different repository, where they had to be published and pulled down through a versioning system. To do this, I leveraged Lerna and Nexus, which is similar to how 3rd-party NPM packages are deployed and utilized. As a result of this model, I constantly dealt with issues pertaining to component isolation and breaking changes.

![section-3-2.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-2.png)

To address these issues, I wanted to consolidate the Design System and Tenable.io repositories into one. To ensure our monorepo would be fast and efficient, I also introduced the [NX framework](https://nx.dev/) to only rebuild parts of the system that were impacted by a change.

## The Solution

#### The Monorepo Is Born
The first step in updating our architecture was to bring the Design System into the Tenable.io repository. This involved the following:

- **Design System components** — The components themselves were broken apart into a series of subdirectories that all lived under libs/design-system. In this way, they could live alongside our other Tenable.io specific libraries.
- **Design System website** — The website (responsible for documenting the components) was moved to live alongside the Tenable.io application in a directory called apps/design-system.

The following diagram shows how I created the new monorepo based on these changes.

![section-3-3.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-3.png)

It’s important to note that at this point, I made a clear distinction between applications and libraries. This distinction is important because I wanted to ensure a clear import order: that is, I wanted applications to be able to consume libraries but never the other way around.

#### Leveraging NX
In addition to moving the design system, I also wanted the ability to only rebuild applications and libraries based on what was changed. In a monorepo where you may end up having a large number of applications and libraries, this type of functionality is critical to ensure your system doesn’t grow slower over time.

Let’s use an example to demonstrate the intended functionality: In our example, I have a component that is initially only imported by the Design System site. If an engineer changes that component, then I only want to rebuild the Design System because that’s the only place that was impacted by the change. However, if Tenable.io was leveraging that component as well, then both applications would need to be rebuilt. To manage this complexity, I rebuilt the repository [using NX](https://nx.dev/).

So what is NX? NX is a set of tools that enables you to separate your libraries and applications into what NX calls “workspaces”. Think of a workspace as an area in your repository (i.e. a directory) that houses shared code (an application, a utility library, a component library, etc.). Each workspace has a series of commands that can be run against it (build, serve, lint, test, etc.). This way when a workspace is changed, the [nx affected](https://nx.dev/nx-api/nx/documents/affected) command can be run to identify any other workspace that is impacted by the update. As demonstrated here, when I change Component A (living in the design-system/components workspace) and run the affected command, NX indicates that the following three workspaces are impacted by that change: design-system/components, Tenable.io, and Design System. This means that both the Tenable.io and Design System applications are importing that component.

![section-3-4.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-4.png)

This type of functionality is critical for a monorepo to work as it scales in size. Without this your automation server (Jenkins in our case) would grow slower over time because it would have to rebuild, re-lint, and re-test everything whenever a change was made. If you want to learn more about how NX works, please take a look at this [write up](https://nx.dev/concepts/mental-model) that explains some of the above concepts in more detail.

###### Diving Deeper
**Before You Proceed:** The remainder of this article is very technical in nature and is geared towards engineers who wish to learn more about how NX works and the way in which things can be set up. If you wish to see the code associated with the following section, you can check it out in [this branch](https://github.com/jablonnc/microfrontend-demo/tree/1-monorepo-and-nx).

At this point, our repository looks something like the structure of defined workspaces below:

###### Apps

- **design-system** — The static site (built off of Gatsby) that documents our global components.
- **tenable-io** — Our core application that was already in the repository.

###### Libs

- **design-system/components** — A library that houses our global components.
- **design-system/styles** — A library that is responsible for setting up our global theme provider.
- **tenable-io/common** — The pre-existing shared code that the Tenable.io application was leveraging and sharing throughout the application.

![section-3-5.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-5.png)

To reiterate, a workspace is simply a directory in your repository that houses shared code that you want to treat as either an application or a library. The difference here is that an application is standalone in nature and shows what your consumers see, whereas a library is something that is leveraged by n+ applications (your shared code). As shown below, each workspace can be configured with a series of targets (build, serve, lint, test) that can be run against it. This way if a change has been made that impacts the workspace and I want to build all of them, I can tell NX to run the build target (line 6) for all affected workspaces.

![section-3-6.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-6.png)

At this point, our two demo applications resemble the screenshots below. As you can see, there are three library components in use. These are the black, gray, and blue colored blocks on the page. Two of these come from the design-system/components workspace (Test Component 1 & 2), and the other comes from tenable-io/common (Tenable.io Component). These components will be used to demonstrate how applications and libraries are leveraged and relate to one another in the NX framework.

![section-3-7.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-7.png)

![section-3-8.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-8.png)

#### The Power Of NX
Now that you know what our demo application looks like, it’s time to demonstrate the importance of NX. Before I make any updates, I want to showcase the dependency graph that NX uses when analyzing our repository. By running the command [nx dep-graph](https://nx.dev/nx-api/nx/documents/dep-graph), the following diagram appears and indicates how our various workspaces are related. A relationship is established when one app/lib imports from another.

![section-3-9.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-9.png)

I now want to demonstrate the true power and purpose of NX. I start by running the nx affected:apps and nx affected:libs command with no active changes in our repository. Shown below, no apps or libs are returned by either of these commands. This indicates that there are no changes currently in our repository, and, as a result, nothing has been affected.

![section-3-10.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-10.png)

Now I will make a slight update to our test-component-1.tsx file (line 19):

![section-3-11.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-11.png)

![section-3-12.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-12.png)

If I re-run the affected commands above I see that the following apps/lib are impacted: design-system, tenable-io, and design-system/components:

![section-3-13.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-13.png)

Additionally, if I run nx affected:dep-graph I see the following diagram. NX is showing us the above command in visual form, which can be helpful in understanding why the change you made impacted a given application or library.

![section-3-14.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-14.png)

With all of this in place, I can now accomplish a great deal. For instance, a common scenario (and one our initial goals from the previous article) is to run tests for just the workspaces actually impacted by a code change. If I change a global component, I want to run all the unit tests that may have been impacted by that change. This way, I can ensure that our update is truly backwards compatible (which gets harder and harder as a component is used in more locations). I can accomplish this by running the test target on the affected workspaces:

![section-3-15.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-3-15.png)

## Summary
Now you are familiar with how I set up our monorepo and incorporated the NX framework. By doing this, I were able to accomplish two of the goals I started with:

- Global components should live in close proximity to the code leveraging those components. This ensures they are flexible enough to satisfy the needs of the engineers using them.
- Updates to global components should be tested in real time against the code leveraging those components. This ensures the updates are backwards compatible and non-breaking in nature.

Once I successfully set up our monorepo and incorporated the NX framework, our next step was to break apart the Tenable.io application into a series of micro applications that could be built and deployed independently. See the next article in the series to learn how I did this and the lessons I learned along the way.