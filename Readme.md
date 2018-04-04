# System Status Page

The intent of this project is two folds:
1. Provide a powerful open source status page with ease of managing incidents, prompt notification to users and backend API for automated updates.
2. Showcase a system built using NodeJs and React, microservices architecture and easily deployable using Docker.

![](https://drive.google.com/uc?id=1bPbeWawVN4IA7z_pYT9b7r9U0lY7a_ME)

<br />

## Features

- List all the application components and group them accordingly
- Report incidents - real-time or historical
- Add scheduled maintenance
- Markdown support for incident messages

#### What is to come:
As this is a work in progress, below is a list of features to be added soon:
- Notification of new incidents + Twitter updates
- Metrics and Graphs
- Properly documented API
- Improvement on the authentication mechanism for the admin section
- Customize the look of your status page

<br />

## Demo

A demo site is created to view and try out the product: http://status.ktechstudios.com/. This demo site is set up using **AWS and Docker**. Documentation will be added soon about the deployment.

To log in to the admin section:
1. Use this URL: http://status.ktechstudios.com/login
2. username: admin, password: StatusPage123

*Note*: All the data is refreshed every 30 minutes.

<br />


## Architecture

![](https://drive.google.com/uc?id=1lfNGS2uRZN0KSaKivH34Hc7fairvE1NL)


### Technologies Used:

- Microservices, API Gateway - NodeJs, Express, ES6, Babel, Gulp
- FrontEnd - React, Redux, Webpack, SSR
- Database - MongoDB
- Testing - Mocha, Chai, Istanbul, Unit & Integration testing
- Logger - Centralized logger service using *RabbitMq* messaging system.
- Docker

The microservice architectural style is used to run a suite of small services, each running in its own process and communicating with API gateway. Then all clients interact with the API gateway for any request.

### Microservices:
The core logic of the application is divided amongst these microservices.

#### Components Service

This service manages the components of your application. Components are like individual pieces of infrastructure that are listed on the status page. This service exposes the endpoints to create or update individual component or get a list of components.

#### Incidents Service

Incidents are events that are causing a negative impact on your application and you want to communicate that to your users. These are the type of incidents: historical, real-time and scheduled. This service exposes the endpoints to manage all types of incidents.

#### Notification Service

This service is responsible for notifying any subscribers of incidents logged in the system. Once completed, there will be two options available: notification via email or webhook.

#### Logger Service

This service is used to log all messages (debug, warning or error) across other services. All other services communicate with this via RabbitMq messaging queue system. Each service leaves a log message on the queue and this service picks it up and logs it. Currently, the logs can be outputted via console and/or file. Also, there are two types of logs: Application (General application logging) and Request (Log HTTP requests for services.).

### API Gateway

Implementation of an API gateway that is the single entry point for all clients. The API gateway handles requests in one of two ways. Some requests are simply proxied/routed to the appropriate service. It handles other requests by fanning out to multiple services.


<br />

## Local Installation

Pre-requisite: Docker

To install:
1. Copy the .env.example file to .env and populate the environment variables.
2. Review docker-compose.yml to update any environment variables.
3. Run `docker-compose up`
4. Once the docker images are build and started, you can visit the site on http://localhost:7050
