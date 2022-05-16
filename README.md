Deno script to retrieve upcoming urgent quests for
Phantasy Star Online 2: New Genesis.

This isn't a complete solution, you'd want to set up a timer unit or a cronjob
that would actually run the script on a given interval. The following is an
example systemd timer and service unit.

`pso2-alert.timer`
```ini
[Unit]
Description=PSO2 Alert check timer
Requires=pso2-alert.service
After=network-online.target

[Timer]
OnCalendar=*:0,10,30,50
RandomizedDelaySec=15
Persistent=false

[Install]
WantedBy=timers.target
```

`pso2-alert.service`
```ini
[Unit]
Description=PSO2 Alert service
After=network-online.target

[Service]
Type=oneshot
ExecStart=deno run -A /home/intrnl/misc/pso2-alerts/mod.js
WorkingDirectory=/home/intrnl/misc/pso2-alerts
```
