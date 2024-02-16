---
layout: post
title:  "Introducing the Monorepo & NX"
post-type: blog
categories: [ Tutorial, Micro Frontend, NX, Module Federation ]
image: assets/images/blog/micro-frontend-journey/icon.png
---

This is post 8 of 9 in the series

1. [Introduction]({{ site.baseurl }}/micro-frontend-journey-1)
2. [Why I Implemented a Micro Frontend]({{ site.baseurl }}/micro-frontend-journey-2)
3. [Introducing the Monorepo & NX]({{ site.baseurl }}/micro-frontend-journey-3)
4. [Introducing Module Federation]({{ site.baseurl }}/micro-frontend-journey-4)
5. [Module Federation — Managing Your Micro-Apps]({{ site.baseurl }}/micro-frontend-journey-5)
6. [Module Federation — Sharing Vendor Code]({{ site.baseurl }}/micro-frontend-journey-6)
7. [Module Federation — Sharing Library Code]({{ site.baseurl }}/micro-frontend-journey-7)
8. **[Building & Deploying]({{ site.baseurl }}/micro-frontend-journey-8)**
9. [Summary]({{ site.baseurl }}/micro-frontend-journey-9)

## Overview
This article documents the final phase of our new architecture where I build and deploy our application utilizing our new micro-frontend model.

![section-8-1.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-1.png)

## The Problem
If you have followed along up until this point, you can see how I started with a relatively simple architecture. Like a lot of companies, our build and deployment flow looked something like this:

1. An engineer merges their code to master.
2. A Jenkins build is triggered that lints, tests, and builds the entire application.
3. The built application is then deployed to a QA environment.
4. End-2-End (E2E) tests are run against the QA environment.
5. The application is deployed to production. If it’s a CICD flow this occurs automatically if E2E tests pass, otherwise this would be a manual deployment.

![section-8-2.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-2.png)

In our new flow this would no longer work. In fact, one of our biggest challenges in implementing this new architecture was in setting up the build and deployment process to transition from a single build (as demonstrated above) to multiple applications and libraries.

## The Solution

Our new solution involved three primary Jenkins jobs:

- **Seed Job** — Responsible for identifying what applications/libraries needed to be rebuilt (via the nx affected command). Once this was determined, its primary purpose was to then kick off n+ of the next two jobs discussed.
- **Library Job** — Responsible for linting and testing any library workspace that was impacted by a change.
- **Micro-App Jobs** — A series of jobs pertaining to each micro-app. Responsible for linting, testing, building, and deploying the micro-app.

With this understanding in place, let’s walk through the steps of the new flow:

**Phase 1** — In our new flow, phase 1 includes building and deploying the code to our QA environments where it can be properly tested and viewed by our various internal stakeholders (engineers, quality assurance, etc.):

1. An engineer merges their code to master. In the diagram below, an engineer on Team 3 merges some code that updates something in their application (Application C).
2. The Jenkins seed job is triggered, and it identifies what applications and libraries were impacted by this change. This job now kicks off an entirely independent pipeline related to the updated application. In this case, it kicked off the Application C pipeline in Jenkins.
3. The pipeline now lints, tests, and builds Application C. It’s important to note here how it’s only dealing with a piece of the overall application. This greatly improves the overall build times and avoids long queues of builds waiting to run.
4. The built application is then deployed to the QA environments.
5. End-2-End (E2E) tests are run against the QA environments.
6. Our deployment is now complete. For our purposes, I felt that a manual deployment to production was a safe approach for us and one that still offered us the flexibility and efficiency I needed.

![section-8-3.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-3.png)

**Phase 2** — This phase (shown in the diagram after the dotted line) occurred when an engineer was ready to deploy their code to production:

1. An engineer deployed their given micro-app to staging. In this case, the engineer would go into the build for Application C and deploy from there.
2. For our purposes, I deployed to a staging environment before production to perform a final spot check on our application. In this type of architecture, you may only encounter a bug related to the decoupled nature of your micro-apps. You can read more about this type of issue in the previous article under the Sharing State/Storage/Theme section. This final staging environment allowed us to catch these issues before they made their way to production.
3. The application is then deployed to production.

![section-8-4.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-4.png)

While this flow has more steps than our original one, I found that the pros outweigh the cons. Our builds are now more efficient as they can occur in parallel and only have to deal with a specific part of the repository. Additionally, our teams can now move at their own pace, deploying to production when they see fit.

## Diving Deeper

**Before You Proceed:** The remainder of this article is very technical in nature and is geared towards engineers who wish to learn the specifics of how I build and deploy our applications.

#### Build Strategy
I will now discuss the three job types discussed above in more detail. These include the following: seed job, library job, and micro-app jobs.

###### The Seed Job

This job is responsible for first identifying what applications/libraries needed to be rebuilt. How is this done? I will now come full circle and understand the importance of introducing the NX framework that I discussed in a previous article. By taking advantage of this framework, I created a system by which I could identify which applications and libraries (our “workspaces”) were impacted by a given change in the system (via the nx affected command). Leveraging this functionality, the build logic was updated to include a Jenkins seed job. A seed job is a normal Jenkins job that runs a [Job DSL](https://plugins.jenkins.io/job-dsl/) script and in turn, the script contains instructions that create and trigger additional jobs. In our case, this included micro-app jobs and/or a library job which we’ll discuss in detail later.

**Jenkins Status** — An important aspect of the seed job is to provide a visualization for all the jobs it kicks off. All the triggered application jobs are shown in one place along with their status:

- **Green** — Successful build
- **Yellow** — Unstable
- **Blue** — Still processing
- **Red (not shown)** — Failed build

![section-8-5.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-5.png)

**Github Status** — Since multiple independent Jenkins builds are triggered for the same commit ID, I had to pay attention to the representation of the changes in GitHub to not lose visibility of broken builds in the PR process. Each job registers itself with a unique context with respect to github, providing feedback on what sub-job failed directly in the PR process:

![section-8-6.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-6.png)

**Performance, Managing Dependencies** — Before a given micro-app and/or library job can perform its necessary steps (lint, test, build), it needs to install the necessary dependencies for those actions (those defined in the package.json file of the project). Doing this every single time a job is run is very costly in terms of resources and performance. Since all of these jobs need the same dependencies, it makes much more sense if I can perform this action once so that all the jobs can leverage the same set of dependencies.

To accomplish this, the node execution environment was dockerised with all necessary dependencies installed inside a container. As shown below, the seed job maintains the responsibility for keeping this container in sync with the required dependencies. The seed job determines if a new container is required by checking if changes have been made to package.json. If changes are made, the seed job generates the new container prior to continuing any further analysis and/or build steps. The jobs that are kicked off by the seed (micro-app jobs and the library job) can then leverage that container for use:

![section-8-7.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-7.png)

This approach led to the following benefits:

- Proved to be much faster than downloading all development dependencies for each build (step) every time needed.
- The use of a pre-populated container reduced the load on the internal Nexus repository manager as well as the network traffic.
- Allowed us to run the various build steps (lint, unit test, package) in parallel thus further improving the build times.

**Performance, Limiting The Number Of Builds Run At Once** — To facilitate the smooth operation of the system, the seed jobs on master and feature branch builds use slightly different logic with respect to the number of builds that can be kicked off at any one time. This is necessary as I have a large number of active development branches and triggering excessive jobs can lead to resource shortages, especially with required agents. When it comes to the concurrency of execution, the differences between the two are:

- **Master branch** — Commits immediately trigger all builds concurrently.
- **Feature branches** — Allow only one seed job per branch to avoid system overload as every commit could trigger 10+ sub jobs depending on the location of the changes.

Another attempt to reduce the amount of builds generated is the way in which the nx affected command gets used by the master branch versus the feature branches:

- **Master branch** — Will be called against the latest tag created for each application build. Each master / production build produces a tag of the form APP<uniqueAppId>_<buildversion>. This is used to determine if the specific application needs to be rebuilt based on the changes.
- **Feature branches** — I use master as a reference for the first build on the feature branch, and any subsequent build will use the commit-id of the last successful build on that branch. This way, I are not constantly rebuilding all applications that may be affected by a diff against master, but only the applications that are changed by the commit.

To summarize the role of the seed job, the diagram below showcases the logical steps it takes to accomplish the tasks discussed above.

![section-8-8.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-8.png)

###### The Library Job

I will now dive into the jobs that Seed kicks off, starting with the library job. As discussed in our previous articles, our applications share code from a libs directory in our repository.

![section-8-9.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-9.png)

Before I go further, it’s important to understand how library code gets built and deployed. When a micro-app is built (ex. nx build host), its deployment package contains not only the application code but also all the libraries that it depends on. When I build the Host and Application 1, it creates a number of files starting with “libs_…” and “node_modules…”. This demonstrates how all the shared code (both vendor libraries and your own custom libraries) needed by a micro-app is packaged within (i.e. the micro-apps are self-reliant). While it may look like your given micro-app is extremely bloated in terms of the number of files it contains, keep in mind that a lot of those files may not actually get leveraged if the micro-apps are sharing things appropriately.

![section-8-10.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-10.png)

This means building the actual library code is a part of each micro-app’s build step, which is discussed below. However, if library code is changed, I still need a way to lint and test that code. If you kicked off 5 micro-app jobs, you would not want each of those jobs to perform this action as they would all be linting and testing the exact same thing. Our solution to this was to have a separate Jenkins job just for our library code, as follows:

1. Using the [nx affected:libs](https://nx.dev/nx-api/nx/documents/print-affected) command, I determine which library workspaces were impacted by the change in question.
2. Our library job then lints/tests those workspaces. In parallel, our micro-apps also lint, test and build themselves.
3. Before a micro-app can finish its job, it checks the status of the libs build. As long as the libs build was successful, it proceeds as normal. Otherwise, all micro-apps fail as well.

![section-8-11.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-11.png)

###### The Micro-App Jobs
Now that you understand how the seed and library jobs work, let’s get into the last job type: the micro-app jobs.

**Configuration** — As discussed previously, each micro-app has its own Jenkins build. The build logic for each application is implemented in a micro-app specific Jenkinsfile that is loaded at runtime for the application in question. The pattern for these small snippets of code looks something like the following:

![section-8-12.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-12.png)

The jenkins/Jenkinsfile.template (leveraged by each micro-app) defines the general build logic for a micro-application. The default configuration in that file can then be overwritten by the micro-app:

![section-8-13.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-13.png)

This approach allows all our build logic to be in a single place, while easily allowing us to add more micro-apps and scale accordingly. This combined with the job DSL makes adding a new application to the build / deployment logic a straightforward and easy to follow process.

**Managing Parallel Jobs** — When I first implemented the build logic for the jobs, I attempted to implement as many steps as possible in parallel to make the builds as fast as possible, which you can see in the Jenkins parallel step below:

![section-8-14.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-14.png)

After some testing, I found that linting + building the application together takes about as much time as running the unit tests for a given product. As a result, I combined the two steps (linting, building) into one (assets-build) to optimize the performance of our build. I highly recommend you do your own analysis, as this will vary per application.

###### Deployment strategy

Now that you understand how the build logic works in Jenkins, let’s see how things actually get deployed.

**Checkpoints** — When an engineer is ready to deploy their given micro-app to production, they use a checkpoint. Upon clicking into the build they wish to deploy, they select the checkpoints option. As discussed in our initial flow diagram, I force our engineers to first deploy to our staging environment for a final round of testing before they deploy their application to production.

![section-8-15.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-15.png)

![section-8-16.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-16.png)

Once approval is granted, the engineer can then deploy the micro-app to production using another checkpoint:

![section-8-17.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-17.png)

![section-8-18.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-18.png)

**S3 Strategy** — The new logic required a rework of the whole deployment strategy as well. In our old architecture, the application was deployed as a whole to a new S3 location and then the central gateway application was informed of the new location. This forced the clients to reload the entire application as a whole.

![section-8-19.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-19.png)

Our new strategy reduces the deployment impact to the customer by only updating the code on S3 that actually changed. This way, whenever a customer pulls down the code for the application, they are pulling a majority of the code from their browser cache and only updated files have to be brought down from S3.

![section-8-20.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-20.png)

One thing I had to be careful about was ensuring the index.html file is only updated after all the granular files are pushed to S3. Otherwise, I run the risk of our updated application requesting files that may not have made their way to S3 yet.

**Bootstrapper Job** — As discussed above, micro-apps are typically deployed to an environment via an individual Jenkins job:

![section-8-21.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-21.png)

However, I ran into a number of instances where I needed to deploy all micro-apps at the same time. This included the following scenarios:

- **Shared state** — While I tried to keep our micro-apps as independent of one another as possible, I did have instances where I needed them to share state. When I made updates to these areas, I could encounter bugs when the apps got out of sync.
- **Shared theme** — Since I also had a global theme that all micro-apps inherited from, I could encounter styling issues when the theme was updated and apps got out of sync.
- **Vendor Library Update** — Updating a vendor library like react where there could be only one version of the library loaded in.

To address these issues, I created the bootstrapper job. This job has two steps:

- **Build** — The job is run against a specific environment (qa-development, qa-staging, etc.) and pulls down a completely compiled version of the entire application.
- **Deploy** — The artifact from the build step can then be deployed to the specified environment.

![section-8-22.png]({{ site.baseurl }}/assets/images/blog/micro-frontend-journey/section-8-22.png)

## Conclusion

Our new build and deployment flow was the final piece of our new architecture. Once it was in place, I were able to successfully deploy individual micro-apps to our various environments in a reliable and efficient manner. This was the final phase of our new architecture, please see the last article in this series for a quick recap of everything I learned.

