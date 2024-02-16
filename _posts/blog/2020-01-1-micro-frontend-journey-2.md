---
layout: post
title:  "Why I Implemented A Micro Frontend"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

This is post 2 of 9 in the series

1. [Introduction]({{ site.baseurl }}/micro-frontend-journey-1)
2. **[Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2)**
3. [Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3)
4. [Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4)
5. [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5)
6. [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6)
7. [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7)
8. [Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8)
9. [Summary]({{ site.baseurl }}/micro-frontend-journey-9)

## Overview 

This article documents the discovery phase of our journey toward a new architecture. Like any engineering group, I didn’t simply wake up one day and decide it would be fun to rewrite our entire architecture. Rather, I found ourselves with an application that was growing exponentially in size and complexity, and discovered that our existing architecture didn’t support this type of growth for a variety of reasons. Before I dive into how I revamped our architecture to fix these issues, let’s set the stage by outlining what our architecture used to look like and where the problems existed.

![section-2-1.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-2-1.png)

## Our Initial Architecture
When one of our core applications (Tenable.io) was first built, it consisted of two separate repositories:

- **Design System Repository** — This contained all the global components that were used by Tenable.io. For each iteration of a given component, it was published to a [Nexus repository](https://www.sonatype.com/products/sonatype-nexus-repository) (our private npm repository) leveraging [Lerna](https://lerna.js.org/). Package versions were incremented following semver (ex. 1.0.0). Additionally, it also housed a static design system site, which was responsible for documenting the components and how they were to be used.
- **Tenable.io Repository** — This contained a single page application built using webpack. The application itself pulled down components from the Nexus repository according to the version defined in the package.json.

This was a fairly traditional architecture and served us well for some time. Below is a simplified diagram of what this architecture looked like:

![section-2-2.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-2-2.png)


## The Problem
As our application continued to grow, I created more teams to manage individual parts of the application. While this was beneficial in the sense that I were able to work at a quicker pace, it also led to a variety of issues.

#### Component Isolation
Due to global components living in their own repository, I began encountering an issue where components did not always work appropriately when they were integrated into the actual application. While developing a component in isolation is nice from a developmental standpoint, the reality is that the needs of an application are diverse, and typically this means that a component must be flexible enough to account for these needs. As a result, it becomes extremely difficult to determine if a component is going to work appropriately until you actually try to leverage it in your application.

![section-2-3.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-2-3.png)

**Solution #1** — Global components should live in close proximity to the code leveraging those components. This ensures they are flexible enough to satisfy the needs of the engineers using them.

#### Component Bugs & Breaking Changes
I also encountered a scenario where a bug was introduced in a given component but was not found or realized until a later date. Since component updates were made in isolation within another repository, engineers working on the Tenable.io application would only pull in updated components when necessary. When this did occur, they were typically jumping between multiple versions at once (ex. 1.0.0 to 1.4.5). When the team discovered a bug, it may have been from one of the versions in between (ex. 1.2.2). Trying to backtrack and identify which particular version introduced the bug was a time-consuming process.

![section-2-4.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-2-4.png)

**Solution #2** — Updates to global components should be tested in real time against the code leveraging those components. This ensures the updates are backwards compatible and non-breaking in nature.

One Team Blocks All Others
One of the most significant issues I faced from an architectural perspective was the blocking nature of our deployments. Even though a large number of teams worked on different areas of the application that were relatively isolated, if just one team introduced a breaking change it blocked all the other teams.

![section-2-5.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-2-5.png)

**Solution #3** — Feature teams should move at their own pace, and their impact on one another should be limited as much as possible.

### Slow Development
As I added more teams and more features to Tenable.io, the size of our application continued to grow, as demonstrated below.

![section-2-6.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-2-6.png)


If you’ve ever been the one responsible for managing the webpack build of your application, you’ll know that the bigger your application gets, the slower your build becomes. This is simply a result of having more code that must be compiled/re-compiled as engineers develop features. This not only impacted local development, but our Jenkins build was also getting slower over time as things grew, because it had to lint, test, and build more and more over time. I employed a number of solutions in an attempt to speed up our build, including: The DLL Plugin, SplitChunksPlugin, Tweaking Our Minification Configuration, etc. However, I began realizing that at a certain point there wasn’t much more I could do and I needed a better way to build out the different parts of the application (note: something like [parallel-webpack](https://github.com/trivago/parallel-webpack) could have helped here if I had gone down a different path).

**Solution #4** — Engineers should be capable of building the application quickly for development purposes regardless of the size of the application as it grows over time. In addition, Jenkins should be capable of testing, linting, and building the application in a performant manner as the system grows.

## The Solution
At a certain point, I decided that our architecture was not satisfying our needs. As a result, I made the decision to update it. Specifically, I believed that moving towards a monorepo based on a micro-frontend architecture would help us address these needs by offering the following benefits:

- **Monorepo** — While definitions vary, in our case a monorepo is a single repository that houses multiple applications. Moving to a monorepo would entail consolidating the Design System and the Tenable.io repositories into one. By combining them into one repository, I can ensure that updates made to components are tested in real time by the code consuming them and that the components themselves are truly satisfying the needs of our engineers.
- **Micro-Frontend** — As [defined here](https://www.toptal.com/front-end/micro-frontends-strengths-benefits#:~:text=Micro%2Dfrontend%20architecture%20is%20a,%E2%80%9Cmicroapps%E2%80%9D%20working%20loosely%20together.&text=They%20can%20provide%20a%20means,side%20by%20side%20with%20it.), a “Micro-frontend architecture is a design approach in which a front-end app is decomposed into individual, semi-independent ‘microapps’ working loosely together.” For us, this means splitting apart the Tenable.io application into multiple micro-applications (we’ll use this term moving forward). Doing this allows teams to move at their own pace and limit their impact on one another. It also speeds up the time to build the application locally by allowing engineers to choose which micro applications to build and run.

## Summary
With these things in mind, I began to develop a series of architectural diagrams and roadmaps that would enable us to move from point A to point B. Keep in mind, though, at this point I were dealing with an enterprise application that was in active development and in use by customers. For anyone who has ever been through this process, trying to revamp your architecture at this stage is somewhat akin to [changing a tire while driving](https://www.youtube.com/watch?v=B_1bAnLqlMo).

As a result, I had to ensure that as I moved towards this new architecture, our impact on the normal development and deployment of the application was minimal. While there were plenty of bumps and bruises along the way, which I will share as I go, I were able to accomplish this through a series of phases. In the following articles, I will walk through these phases. See the [next article]({{ site.baseurl }}/micro-frontend-journey-3) to learn how I moved to a monorepo leveraging the NX framework.
