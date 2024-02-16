---
layout: post
title:  "Wrapping A Journey Implementing a Micro Frontend"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

I hope you now have a better understanding of how you can successfully create a micro-front end architecture. Before I call it a day, let’s give a quick recap of what was covered.

## What You Learned
- [Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2) — You learned where I started, specifically what our architecture used to look like and where the problems existed. You then learned how I planned on solving those problems with a new architecture.
- [Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3) — You learned how I combined two of our repositories into one: a monorepo. You then saw how I leveraged the NX framework to identify which part of the repository changed, so I only needed to rebuild that portion.
- [Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4) — You learned how I leverage webpacks module federation to break our main application into a series of smaller applications called micro-apps, the purpose of which was to build and deploy these applications independently of one another.
- [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5) — You learned how I consolidated configurations and logic pertaining to our micro-apps so I could easily manage and serve them as our codebase continued to grow.
- [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6) — You learned the importance of sharing vendor library code between applications and some related best practices.
- [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7) — You learned the importance of sharing custom library code between applications and some related best practices.
- [Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8) — You learned how I build and deploy our application using this new model.

## Key Takeaways

If you take anything away from this series, let it be the following:

#### The Earlier, The Better
I can tell you from experience that implementing an architecture like this is much easier if you have the opportunity to start from scratch. If you are lucky enough to start from scratch when building out an application and are interested in a micro-frontend, laying the foundation before anything else is going to make your development experience much better.

#### Evaluate Before You Act
Before you decide on an architecture like this, make sure it’s really what you want. Take the time to assess your issues and how your company operates. Without company support, pulling off this approach is extremely difficult.

#### Only Build What Changed
Using a tool like NX is critical to a monorepo, allowing you to only rebuild those parts of the system that were impacted by a change.

#### Micro-front Ends Are Not For Everyone
I know this type of architecture is not for everyone, and you should truly consider what your organization needs before going down this path. However, it has been very rewarding for us, and has truly transformed how I deliver solutions to our customers.

#### Don’t Forget To Share
When it comes to module federation, sharing is key. Learning when and how to share code is critical to the successful implementation of this architecture.

#### Be Careful Of What You Share
Sharing things like state between your micro-apps is a dangerous thing in a micro-frontend architecture. Learning to put safeguards in place around these areas is critical, as well as knowing when it might be necessary to deploy all your applications at once.

## Summary

I hope you enjoyed this series and learned a thing or two about the power of NX and module federation. If this article can help just one engineer avoid a mistake I made, then we’ll have done our job. Happy coding!