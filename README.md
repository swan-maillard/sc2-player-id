# StarCraft II player identification

A one-page explainer for a class competition we did at INSA Lyon: given only the keystrokes of one StarCraft II game, say which of 200 players played it. The page takes a game's action log, splits it into time windows and phases, and turns it into the same 48 numbers our models were trained on, with the same code as our notebook, rewritten in TypeScript. Next to it are the real results: which features the random forest leaned on, and how seven models compared.

Live page: https://swan-maillard.github.io/sc2-player-id/

## The project

Data mining course, 5th year at INSA Lyon, January and February 2025. We were two, Benjamin Maison and me. Code: https://github.com/swan-maillard/INSA-5A-DataMining

Our best model, a random forest on these 48 features, named the right player for 94.4% of a held-out 20% of the training games.

## What this demo shows

- The action log of a game (real first seconds of ten games, or one you build), cut into the windows between time markers.
- The three phases (first minute, 1 to 6 minutes, 6 to 25 minutes) and how many seconds each one counts.
- The 45 rates plus the three race columns. Pick a cell and the panel shows the count, the seconds and where the feature ranks in both importance measures.
- The feature importances of the rf v1 forest, sortable and groupable by phase, and the held-out accuracy of the seven models, with their cross-validation scores.

## Differences with the school version

- The dataset was on Kaggle behind the class competition and isn't public, so there's no real full game here and no model is trained in the browser. The only real logs are the first 8 to 13 tokens of the games the notebooks printed, plus the example on the competition's data page.
- The notebook kept the importance plots but not the numbers, so `scripts/importance_from_plots.py` reads the bars back from the PNGs in the notebook. They're good to about ±0.0001.
- Model accuracies are copied from the notebooks' printed output.

## Run it

```
npm install
npm run dev
npm test
```

The tests check that the TypeScript gives the same windows and the same 45 rates as the notebook's own Python on the same inputs. To regenerate the reference values, point `scripts/notebook_reference.py` at `ml/notebook-rf-v1.ipynb` from the project repo: it runs the notebook's functions unchanged.
