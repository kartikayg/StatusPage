{application, rabbitmq_web_dispatch,
 [{description, "RabbitMQ Web Dispatcher"},
  {vsn, "3.6.6"},
  {modules, ['rabbit_web_dispatch','rabbit_web_dispatch_app','rabbit_web_dispatch_registry','rabbit_web_dispatch_sup','rabbit_web_dispatch_util','rabbit_webmachine','rabbit_webmachine_error_handler']},
  {registered, []},
  {mod, {rabbit_web_dispatch_app, []}},
  {env, []},
  {applications, [kernel, stdlib, rabbit_common, rabbit, mochiweb, webmachine]}]}.
