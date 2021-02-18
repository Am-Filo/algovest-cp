# Algovest project

> project version 1.0.0

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 10.2.0.

### Install project

1. Use nodejs 12 `nvm use 12`, if you don't have node 12 you can installed it or use 10.x.x.
2. Install dependency `npm install`.
3. To run application in development enviroment use command `npm run start:dev`.

To build application in use command `npm run build` this command create a new folder **dist** in project root.

To create project documentation run `npm run compodoc` this command create new folder **documantation** in project root.

### Settings

#### Network

Change application chain.
Go to file `settings.json` in `assets/js/`, you will see a json object:

```
{
  "production": false,
  "network": "rinkeby",
  "net": 4
}
```

To set mainnet change `production` to true, if you want to change development chain to ropsten or another change `network` and `chain` params.
For example run in **ropsten** chain:

```
{
  "production": false,
  "network": "ropsten",
  "net": 3
}
```

Then you need to update abi and address for ropsten contracts in file `contracts.json` in `assets/js/`.
For example:

```
  "ropsten": {
    "Staking": {
      "ADDRESS": "",
      "ABI": []
    },
    "Token": {
      "ADDRESS": "",
      "ABI": []
    }
  },
```

###### **Attention! If you create a mainnet build you need to provide a mainnet settings in contracts.json**

```
  "mainnet": {
    "Staking": {
      "ADDRESS": "YOUR_MAINET_ADDRESS",
      "ABI": [YOUR_MAINET_ABI]
    },
    "Token": {
      "ADDRESS": "YOUR_MAINET_ADDRESS",
      "ABI": [YOUR_MAINET_ABI]
    }
  },
```

All settings you can also change after create production build. In `dist` folder go to `assets/js/settings.json` and change everything you want.

##### Contract

Change application contracts.
Go to file `contracts.json` in `assets/js/`, you will see a json object:

```
  "mainnet": {
    "Staking": {
      "ADDRESS": "",
      "ABI": []
    },
    "Token": {
      "ADDRESS": "",
      "ABI": []
    }
  },
  "rinkeby": {
    "Staking": {
      "ADDRESS": "",
      "ABI": []
    },
    "Token": {
      "ADDRESS": "",
      "ABI": []
    }
  },
```

Change or add contracts for all chains what you want to use.
All contracts you can also change after create production build. In `dist` folder go to `assets/js/contracts.json` and change everything you want.
