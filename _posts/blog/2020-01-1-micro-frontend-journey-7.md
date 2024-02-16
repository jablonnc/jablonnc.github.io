---
layout: post
title:  "Introducing the Monorepo & NX"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

This is post 7 of 9 in the series

1. [Introduction]({{ site.baseurl }}/micro-frontend-journey-1)
2. [Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2)
3. [Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3)
4. [Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4)
5. [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5)
6. [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6)
7. **[Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7)**
8. [Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8)
9. [Summary]({{ site.baseurl }}/micro-frontend-journey-9)

## Overview
This article focuses on the importance of sharing your custom library code between applications and some related best practices.

![section-7-1.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-1.png)

## The Problem
As discussed in the previous article, sharing code is critical to using module federation successfully. In the last article I focused on sharing vendor code. Now, I want to take those same principles and apply them to the custom library code I have living in the libs directory. As illustrated below, App A and B both use Lib 1. When these micro-apps are built, they each contain a version of that library within their build artifact.

![section-7-2.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-2.png)

Assuming you read the previous article, you now know why this is important. As shown in the diagram below, when App A is loaded in, it pulls down all the libraries shown. When App B is loaded in it’s going to do the same thing. The problem is once again that App B is pulling down duplicate libraries that App A has already loaded in.

![section-7-3.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-3.png)

## The Solution
Similar to the vendor libraries approach, I need to tell module federation that I would like to share these custom libraries. This way once I load in App B, it’s first going to check and see what App A has already loaded and leverage any libraries it can. If it needs a library that hasn’t been loaded in yet (or the version it needs isn’t compatible with the version App A loaded in), then it will proceed to load on its own. Otherwise, if it’s the only micro-app using that library, it will simply bundle a version of that library within itself (ex. Lib 2).

![section-7-4.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-4.png)

## Diving Deeper

**Before You Proceed:** The remainder of this article is very technical in nature and is geared towards engineers who wish to learn more about sharing custom library code between your micro-apps. If you wish to see the code associated with the following section, you can check it out in [this branch](https://github.com/jablonnc/microfrontend-demo/tree/5-module-federation-sharing-library-code).

To demonstrate sharing libraries, we’re going to focus on Test Component 1 that is imported by the Host and Application 1:

![section-7-5.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-5.png)

![section-7-6.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-6.png)

This particular component lives in the design-system/components workspace:

![section-7-7.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-7.png)

I leverage the tsconfig.base.json file to build out our aliases dynamically based on the component paths defined in that file. This is an easy way to ensure that as new paths are added to your libraries, they are automatically picked up by webpack:

![section-7-8.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-8.png)

How does webpack currently treat this library code? If I were to investigate the network traffic before sharing anything, I would see that the code for this component is embedded in two separate files specific to both Host and Application 1 (the code specific to Host is shown below as an example). At this point the code is not shared in any way and each application simply pulls the library code from its own bundle.

![section-7-9.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-9.png)

As your application grows, so does the amount of code you share. At a certain point, it becomes a performance issue when each application pulls in its own unique library code. We’re now going to update the shared property of the ModuleFederationPlugin to include these custom libraries.

Sharing our libraries is similar to the vendor libraries discussed in the previous article. However, the mechanism of defining a version is different. With vendor libraries, I were able to rely on the versions defined in the package.json file. For our custom libraries, I don’t have this concept (though you could technically introduce something like that if you wanted). To solve this problem, I decided to use a unique identifier to identify the library version. Specifically, when I build a particular library, I actually look at the folder containing the library and generate a unique hash based off of the contents of the directory. This way, if the contents of the folder change, then the version does as well. By doing this, I can ensure micro-apps will only share custom libraries if the contents of the library match.

![section-7-10.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-10.png)

![section-7-11.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-11.png)

**Note:** I are once again leveraging the tsconfig.base.json to dynamically build out the libs that should be shared. I used a similar approach above for building out our aliases.

If I investigate the network traffic again and look for libs_design-system_components (webpack’s filename for the import from @microfrontend-demo/design-system/components), I can see that this particular library has now been split into its own individual file. Furthermore, only one version gets loaded by the Host application (port 3000). This indicates that I are now sharing the code from @microfrontend-demo/design-system/components between the micro-apps.

![section-7-12.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-12.png)

## Going More Granular

**Before You Proceed:** If you wish to see the code associated with the following section, you can check it out in [this branch](https://github.com/jablonnc/microfrontend-demo/tree/5-module-federation-sharing-library-code-granular).

Currently, when I import one of the test components, it comes from the index file shown below. This means the code for all three of these components gets bundled together into one file shown above as “libs_design-system_components_src_index…”.

![section-7-13.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-13.png)

Imagine that I continue to add more components:

![section-7-14.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-14.png)

You may get to a certain point where you think it would be beneficial to not bundle these files together into one big file. Instead, you want to import each individual component. Since the alias configuration in webpack is already leveraging the paths in the tsconfig.base.json file to build out these aliases dynamically (discussed above), I can simply update that file and provide all the specific paths to each component:

![section-7-15.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-15.png)

I can now import each one of these individual components:

![section-7-16.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-16.png)

If I investigate our network traffic, I can see that each one of those imports gets broken out into its own individual file:

![section-7-17.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-17.png)

This approach has several pros and cons that I discovered along the way:

###### Pros

- **Less Code To Pull Down** — By making each individual component a direct import and by listing the component in the shared array of the ModuleFederationPlugin, I ensure that the micro-apps share as much library code as possible.
- **Only The Code That Is Needed Is Used** — If a micro-app only needs to use one or two of the components in a library, they aren’t penalized by having to import a large bundle containing more than they need.

###Cons

- **Performance** — Bundling, the process of taking a number of separate files and consolidating them into one larger file, is a really good thing. If you continue down the granular path for everything in your libraries, you may very well find yourself in a scenario where you are importing hundreds of files in the browser. When it comes to browser performance and caching, there’s a balance to loading a lot of small granular files versus a few larger ones that have been bundled.
I recommend you choose the solution that works best based on your codebase. For some applications, going granular is an ideal solution and leads to the best performance in your application. However, for another application this could be a very bad decision, and your customers could end up having to pull down a ton of granular files when it would have made more sense to only have them pull down one larger file. So as I did, you’ll want to do your own performance analysis and use that as the basis for your approach.

#### Pitfalls
When it came to the code in our libs directory, I discovered two important things along the way that you should be aware of.

Hybrid Sharing Leads To Bloat — When I first started using module federation, I had a library called tenable.io/common. This was a relic from our initial architecture and essentially housed all the shared code that our various applications used. Since this was originally a directory (and not a library), our imports from it varied quite a bit. As shown below, at times I imported from the main index file of tenable-io/common (tenable-io/common.js), but in other instances I imported from sub directories (ex. tenable-io/common/component.js) and even specific files (tenable-io/component/component1.js). To avoid updating all of these import statements to use a consistent approach (ex. only importing from the index of tenable-io/common), I opted to expose every single file in this directory and shared it via module federation.

To demonstrate why this was a bad idea, we’ll walk through each of these import types: starting from the most global in nature (importing the main index file) and moving towards the most granular (importing a specific file). As shown below, the application begins by importing the main index file which exposes everything in tenable-io/common. This means that when webpack bundles everything together, one large file is created for this import statement that contains everything (we’ll call it common.js).

![section-7-18.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-18.png)

I then move down a level in our import statements and import from subdirectories within tenable-io/common (components and utilities). Similar to our main index file, these import statements contain everything within their directories. Can you see the problem? This code is already contained in the common.js file above. I now have bloat in our system that causes the customer to pull down more javascript than necessary.

![section-7-19.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-19.png)

I now get to the most granular import statement where we’re importing from a specific file. At this point, I have a lot of bloat in our system as these individual files are already contained within both import types above.

![section-7-20.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-20.png)

As you can imagine, this can have a dramatic impact on the performance of your application. For us, this was evident in our application early on and it was not until I did a thorough performance analysis that I discovered the culprit. I highly recommend you evaluate the structure of your libraries and determine what’s going to work best for you.

**Sharing State/Storage/Theme** — While I tried to keep our micro-apps as independent of one another as possible, I did have instances where I needed them to share state and theming. Typically, shared code lives in an actual file (some-file.js) that resides within a micro-app’s bundle. For example, let’s say I have a notifications library shared between the micro-apps. In the first update, the presentation portion of this library is updated. However, only App B gets deployed to production with the new code. In this case, that’s okay because the code is constrained to an actual file. In this instance, App A and B will use their own versions within each of their bundles. As a result, they can both operate independently without bugs.

![section-7-21.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-21.png)

However, when it comes to things like state (Redux for us), storage (window.storage, document.cookies, etc.) and theming ([styled-components](https://styled-components.com/docs/advanced) for us), you cannot rely on this. This is because these items live in memory and are shared at a global level, which means you can’t rely on them being confined to a physical file. To demonstrate this, let’s say that we’ve made a change to the way state is getting stored and accessed. Specifically, I went from storing our notifications under an object called notices to storing them under notifications. In this instance, once our applications get out of sync on production (i.e. they’re not leveraging the same version of shared code where this change was made), the applications will attempt to store and access notifications in memory in two different ways. If you are looking to create challenging bugs, this is a great way to do it.

![section-7-22.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-7-22.png)

As I soon discovered, most of our bugs/issues resulting from this new architecture came as a result of updating one of these areas (state, theme, storage) and allowing the micro-apps to deploy at their own pace. In these instances, I needed to ensure that all the micro-apps were deployed at the same time to ensure the applications and the state, store, and theming were all in sync. You can read more about how I handled this via a Jenkins bootstrapper job in the next article.

## Summary

At this point you should have a fairly good grasp on how both vendor libraries and custom libraries are shared in the module federation system. See the next article in the series to learn how I build and deploy our application.

