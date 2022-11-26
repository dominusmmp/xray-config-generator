// ** Imports
import Alpine from "alpinejs";
import {v4 as uuidv4} from "uuid";

// ** Initializing AlpineJs
window.Alpine = Alpine;
Alpine.start();

// ** Correct Window Height Issue In Different Screens and Browsers
function appSizeFixing() {
  // Fixing App Height
  const doc = document.documentElement;
  doc.style.setProperty("--app-height", `${window.innerHeight}px`);
}
if (window !== "undefined") {
  appSizeFixing();
  window.addEventListener("resize", appSizeFixing);
}

// ** Generate Config
const configForm = document.querySelector("#config");
configForm.addEventListener("submit", (e) => {
  e.preventDefault();

  let ports = getPorts(parseInt(e.target.users.value));
  let ip = e.target.ip.value;
  let type = e.target.server.value;
  let exTime = new Date().setDate(new Date().getDate() + 30);
  let master = {name: e.target.master.value, id: uuidv4(), path: getRandStr(10)};
  let webPort = e.target.port.value;
  let path = e.target.path.value;
  document.querySelector("#xray").textContent = genXRay(master, ports, exTime, webPort, path, "Asia/Tehran");
  document.querySelector("#bridge").textContent = genBridge(type, ip, ports);
});

function genXRay(master, ports, exTime, webPort, path, timeZone) {
  return ["apt update && apt upgrade -y", "apt install curl socat sqlite3 -y", 'echo -e "N" | bash <(curl -Ls https://raw.githubusercontent.com/vaxilu/x-ui/master/install.sh)', "x-ui stop", getDBInbounds(master, ports, exTime), getDBSettings(webPort, path, timeZone), getDBUsers(username, password), getConfig(master, ports), "x-ui start\nx-ui enable\nx-ui restart\nreboot"].join("\n\n# -----\n\n");
}

function genBridge(type, ip, ports) {
  return ["apt update && apt upgrade -y", type === "caddy" ? "wget https://dl.cloudsmith.io/public/caddy/stable/deb/any-distro/pool/any-version/main/c/ca/caddy_2.6.2/caddy_2.6.2_linux_amd64.deb\napt install ./caddy_2.6.2_linux_amd64.deb" : "apt install nginx -y", type === "caddy" ? getCaddy(ip, ports) : getNGINX(ip, ports), getIPv6Off()].join("\n\n# -----\n\n");
}

function getPorts(num) {
  let result = [];
  while (0 <= result.length && result.length < num) {
    let randNum = Math.floor(10000 + 15000 * Math.random() + 20000 * Math.random() + 20000 * Math.random());
    result.push({number: randNum, id: uuidv4(), path: getRandStr(10)});
  }
  return result;
}

function getDBUsers(username, password) {
  let result = 'echo "id","username","password" > ~/xui_users.csv\n';
  result += `echo 1,"${username}","${password}" >> ~/xui_users.csv\n`;
  result += 'echo -e ".separator ","\n.import ~/xui_users.csv users" | sqlite3 /etc/x-ui/x-ui.db';
  return result;
}

function getDBSettings(webPort, path, timeZone) {
  let result = "tee -a ~/xui_settings.csv << EOF\n";
  result += '"id","user_id","up","down","total","remark","enable","expiry_time","listen","port","protocol","settings","stream_settings","tag","sniffing"';

  result += `
1,"webPort","${webPort}"
2,"secret","${getRandStr(32)}"
3,"webListen",""
4,"webCertFile",""
5,"webKeyFile",""
6,"webBasePath","/${path}/"
7,"xrayTemplateConfig","{
  ""api"": {
    ""services"": [
      ""HandlerService"",
      ""LoggerService"",
      ""StatsService""
    ],
    ""tag"": ""api""
  },
  ""inbounds"": [
    {
      ""listen"": ""127.0.0.1"",
      ""port"": 62789,
      ""protocol"": ""dokodemo-door"",
      ""settings"": {
        ""address"": ""127.0.0.1""
      },
      ""tag"": ""api""
    }
  ],
  ""outbounds"": [
    {
      ""protocol"": ""freedom"",
      ""settings"": {}
    },
    {
      ""protocol"": ""blackhole"",
      ""settings"": {},
      ""tag"": ""blocked""
    }
  ],
  ""policy"": {
    ""system"": {
      ""statsInboundDownlink"": true,
      ""statsInboundUplink"": true
    }
  },
  ""routing"": {
    ""rules"": [
      {
        ""inboundTag"": [
          ""api""
        ],
        ""outboundTag"": ""api"",
        ""type"": ""field""
      },
      {
        ""ip"": [
          ""geoip:private""
        ],
        ""outboundTag"": ""blocked"",
        ""type"": ""field""
      },
      {
        ""outboundTag"": ""blocked"",
        ""protocol"": [
          ""bittorrent""
        ],
        ""type"": ""field""
      }
    ]
  },
  ""stats"": {}
}"
8,"timeLocation","${timeZone}"
`;

  result += "EOF\n";
  result += 'echo -e ".separator ","\n.import ~/xui_settings.csv users" | sqlite3 /etc/x-ui/x-ui.db';
  return result;
}

function getDBInbounds(master, ports, exTime) {
  let result = "tee -a ~/xui_inbounds.csv << EOF\n";
  result += '"id","user_id","up","down","total","remark","enable","expiry_time","listen","port","protocol","settings","stream_settings","tag","sniffing"';

  result += `
1,1,0,0,0,"${master.name}",1,0,"",443,"vless","{
  ""clients"": [
    {
      ""id"": ""${master.id}"",
      ""flow"": ""xtls-rprx-direct""
    }
  ],
  ""decryption"": ""none"",
  ""fallbacks"": []
}","{
  ""network"": ""ws"",
  ""security"": ""none"",
  ""wsSettings"": {
    ""path"": ""/${master.path}"",
    ""headers"": {}
  }
}","inbound-443","{
  ""enabled"": true,
  ""destOverride"": [
    ""http"",
    ""tls""
  ]
}"`;

  for (const port of ports) {
    result += `
${ports.indexOf(port) + 2},1,0,0,${35 * 1024 * 1024 * 1024},"${ports.indexOf(port) + 1}",1,${exTime},"",${port.number},"vless","{
  ""clients"": [
    {
      ""id"": ""${port.id}"",
      ""flow"": ""xtls-rprx-direct""
    }
  ],
  ""decryption"": ""none"",
  ""fallbacks"": []
}","{
  ""network"": ""ws"",
  ""security"": ""none"",
  ""wsSettings"": {
    ""path"": ""/${port.path}"",
    ""headers"": {}
  }
}","inbound-${port.number}","{
  ""enabled"": true,
  ""destOverride"": [
    ""http"",
    ""tls""
  ]
}"
`;
  }

  result += "EOF\n";
  result += 'echo -e ".separator ","\n.import xui_inbounds.csv users" | sqlite3 /etc/x-ui/x-ui.db';
  return result;
}

function getConfig(master, ports) {
  let result = "tee -a /usr/local/x-ui/bin/config.json << EOF\n";
  result += `{
  "log": null,
  "routing": {
    "rules": [
      {
        "inboundTag": [
          "api"
        ],
        "outboundTag": "api",
        "type": "field"
      },
      {
        "ip": [
          "geoip:private"
        ],
        "outboundTag": "blocked",
        "type": "field"
      },
      {
        "outboundTag": "blocked",
        "protocol": [
          "bittorrent"
        ],
        "type": "field"
      }
    ]
  },
  "dns": null,
  "inbounds": [
    {
      "listen": "127.0.0.1",
      "port": 62789,
      "protocol": "dokodemo-door",
      "settings": {
        "address": "127.0.0.1"
      },
      "streamSettings": null,
      "tag": "api",
      "sniffing": null
    },
    {
      "listen": null,
      "port": 443,
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "${master.id}",
            "flow": "xtls-rprx-direct"
          }
        ],
        "decryption": "none",
        "fallbacks": []
      },
      "streamSettings": {
        "network": "ws",
        "security": "none",
        "wsSettings": {
          "path": "/${master.path}",
          "headers": {}
        }
      },
      "tag": "inbound-443",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      }
    }`;

  for (const port of ports) {
    result += `,
    {
      "listen": null,
      "port": ${port.number},
      "protocol": "vless",
      "settings": {
        "clients": [
          {
            "id": "${port.id}",
            "flow": "xtls-rprx-direct"
          }
        ],
        "decryption": "none",
        "fallbacks": []
      },
      "streamSettings": {
        "network": "ws",
        "security": "none",
        "wsSettings": {
          "path": "/${port.path}",
          "headers": {}
        }
      },
      "tag": "inbound-${port.number}",
      "sniffing": {
        "enabled": true,
        "destOverride": ["http", "tls"]
      }
    }`;
  }

  result += `
  ],
  "outbounds": [
    {
      "protocol": "freedom",
      "settings": {}
    },
    {
      "protocol": "blackhole",
      "settings": {},
      "tag": "blocked"
    }
  ],
  "transport": null,
  "policy": {
    "system": {
      "statsInboundDownlink": true,
      "statsInboundUplink": true
    }
  },
  "api": {
    "services": [
      "HandlerService",
      "LoggerService",
      "StatsService"
    ],
    "tag": "api"
  },
  "stats": {},
  "reverse": null,
  "fakeDns": null
}
`;
  result += "EOF\n";
  return result;
}

function getCaddy(ip, ports) {
  let result = "";
  result += "tee -a /etc/caddy/Caddyfile << EOF\n";
  result += "# Security Options\n";
  result += "{\n";
  result += "        admin off\n";
  result += "        auto_https off\n";
  result += "}\n\n";
  result += "# Main User\n";
  result += ":443 {\n";
  result += `        reverse_proxy ${ip}:443\n`;
  result += "}\n\n";
  for (const port of ports) {
    result += `# User${ports.indexOf(port) + 1}\n`;
    result += `:${port.number} {\n`;
    result += `        reverse_proxy ${ip}:${port.number}\n`;
    result += "}\n";
  }
  result += "EOF";

  return result;
}

function getNGINX(ip, ports) {
  let result = "";
  result += "tee -a /etc/nginx/nginx.conf << EOF\n";
  result += "\n\n";
  result += "stream {\n";
  result += "  # Main User\n";
  result += "  server {\n";
  result += `    listen     443;\n`;
  result += `    proxy_pass ${ip}:443;\n`;
  result += "  }\n\n";
  for (const port of ports) {
    result += `  # User${ports.indexOf(port) + 1}\n`;
    result += "  server {\n";
    result += `    listen     ${port.number};\n`;
    result += `    proxy_pass ${ip}:${port.number};\n`;
    result += "  }\n";
  }
  result += "}\nEOF";
  return result;
}

function getIPv6Off() {
  let result = "";
  result += "tee -a /etc/init.d/disipv6.sh << EOF\n";
  result += "#! /bin/sh\n";
  result += "# chkconfig: 345 99 10\n";
  result += 'case "$1" in\n';
  result += "  start)\n";
  result += "    # Executes our script\n";
  result += "    sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1\n";
  result += "    sudo sysctl -w net.ipv6.conf.default.disable_ipv6=1\n";
  result += "    ;;\n";
  result += "  *)\n";
  result += "    ;;\n";
  result += "esac\n";
  result += "exit 0\n";
  result += "EOF\n";
  result += "chmod +x /etc/init.d/disipv6.sh\n";
  result += "reboot\n";
  return result;
}

function getRandStr(length) {
  let result = "";
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
