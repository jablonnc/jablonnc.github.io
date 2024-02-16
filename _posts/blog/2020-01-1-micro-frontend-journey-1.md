---
layout: post
title:  "Introduction: A Journey Implementing a Micro Frontend"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

In the current world of frontend development, picking the right architecture and tech stack can be challenging. With all of the libraries, frameworks, and technologies available, it can seem (to say the least) overwhelming. Learning how other companies tackle a particular challenge is always beneficial to the community as a whole. Therefore, in this series, I hope to share the lessons I have learned in creating a successful micro-frontend architecture.

## What This Series is About

While the term “micro-frontend” has been around for some time, the manner in which you build this type of architecture is ever evolving. New solutions and strategies are introduced all the time, and picking the one that is right for you can seem like an impossible task. This series focuses on creating a micro-frontend architecture by leveraging the NX framework and webpack’s module federation (released in webpack 5). We’ll detail each of the phases from start to finish, and document what I encountered along the way.

![tenable-transformation-1]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-1.png)

The series is broken up into the following articles:

- [Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2) — Explains the discovery phase shown in the infographic above. It talks about where I started and, specifically, what our architecture used to look like and where the problems within that architecture existed. It then goes on to describe how I planned to solve our problems with a new architecture.
- [Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3) — Documents the initial phase of updating our architecture, during which I created a monorepo built off the NX framework. This article focuses on how I leverage NX to identify which part of the repository changed, allowing us to only rebuild that portion.
- [Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4) — Documents the next phase of updating our architecture, where I broke up our main application into a series of smaller applications using webpack’s module federation.
- [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5) — Focuses on how I enhanced our initial approach to building and serving applications using module federation, namely by consolidating the related configurations and logic.
- [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6) —Details the importance of sharing vendor library code between applications and some related best practices.
- [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7) — Explains the importance of sharing custom library code between applications and some related best practices.
- [Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8) — Documents the final phase of our new architecture where I built and deployed our application utilizing our new micro-frontend model.
- [Summary]({{ site.baseurl }}/micro-frontend-journey-9) — Reviews everything I discussed and provides some key takeaways from this series.

## Who is This For?

If you find yourself in any of the categories below, then this series is for you:

- You’re an engineer just getting started, but you have a strong interest in architecture.
- You’re a seasoned engineer managing an ever-growing codebase that keeps getting slower.
- You’re a technical director and you’d like to see an alternative to how your teams work and ship their code.
- You work with engineers on a daily basis, and you’d really like to understand what they mean when they say a micro-frontend.
- You really just like to read!
In conclusion, read on if you want a better understanding of how you can successfully implement a micro-frontend architecture from start to finish.

## How Articles are Structured
Each article in the series is split into two primary parts. The first half (overview, problem, and solution) gives you a high level understanding of the topic of discussion. If you just want to view the “cliff notes”, then these sections are for you.

The second half (diving deeper) is more technical in nature, and is geared towards those who wish to see how I actually implemented the solution. For most of the articles in this series, this section includes a corresponding [demo repository](https://github.com/jablonnc/microfrontend-demo) that further demonstrates the concepts within the article.

## Summary
So, let’s begin! Before I dive into how I updated our architecture, it’s important to discuss the issues I faced that led us to this decision. Check out the next article in the series to get started.