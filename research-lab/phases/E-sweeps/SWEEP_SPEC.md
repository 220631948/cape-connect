# Phase E — Hyperparameter Sweep Specification
## CapeTown GIS Research Lab

> **Status:** COMPLETE  
> **Tooling:** Optuna (Bayesian optimisation, CPU/GPU), deterministic seeding  
> Last updated: 2026-03-09

---

## 1. Sweep Strategy by Experiment

| Experiment | Sweep Needed? | Strategy | n_trials | Pruner |
|------------|:------------:|----------|:--------:|--------|
| EXP-001 | No | Geometric comparison — no hyperparameters | N/A | N/A |
| EXP-002 | **Yes** | Bayesian (TPE) + MedianPruner | 30 | MedianPruner(n_warmup_steps=5) |
| EXP-003 | **Yes** | Grid search (small space) | 18 | N/A |
| EXP-004 | No | Fixed spatial weights — no training | N/A | N/A |

---

## 2. EXP-002 Optuna Sweep Config

```python
# research-lab/phases/E-sweeps/sweep_exp002.py
"""
Reproducible Optuna sweep for EXP-002 — U-Net land-use segmentation.
Usage:
    python sweep_exp002.py --n-trials 30 --seed 42 --output artifacts/EXP-002/sweep/
"""
import optuna
import torch
import yaml
import json
import argparse
from pathlib import Path

SEED = 42

def suggest_hyperparameters(trial: optuna.Trial) -> dict:
    return {
        'lr': trial.suggest_float('lr', 1e-5, 1e-2, log=True),
        'batch_size': trial.suggest_categorical('batch_size', [4, 8, 16]),
        'encoder': trial.suggest_categorical('encoder', ['resnet34', 'efficientnet-b2']),
        'loss': trial.suggest_categorical('loss', ['DiceCELoss', 'FocalLoss']),
        'dropout': trial.suggest_float('dropout', 0.0, 0.4, step=0.1),
    }


def objective(trial: optuna.Trial, config: dict) -> float:
    """Return val_f1_macro (higher = better)."""
    params = suggest_hyperparameters(trial)
    # --- Training logic (import from exp002/train.py) ---
    # val_f1 = train_and_evaluate(params, config, seed=SEED)
    val_f1 = 0.0  # placeholder — replace with actual training call
    return val_f1


def run_sweep(n_trials: int, seed: int, output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)

    # Deterministic sampler: TPE with fixed seed
    sampler = optuna.samplers.TPESampler(seed=seed)
    pruner = optuna.pruners.MedianPruner(n_warmup_steps=5)

    study = optuna.create_study(
        direction='maximize',
        sampler=sampler,
        pruner=pruner,
        study_name=f'EXP-002-unet-sweep-seed{seed}',
    )

    with open('research-lab/experiments/EXP-002/manifest.yaml') as f:
        config = yaml.safe_load(f)

    study.optimize(lambda trial: objective(trial, config), n_trials=n_trials)

    best = {
        'exp_id': 'EXP-002',
        'sweep_seed': seed,
        'n_trials': n_trials,
        'best_trial': study.best_trial.number,
        'best_params': study.best_params,
        'best_value': study.best_value,
        'all_trials': [
            {
                'number': t.number,
                'params': t.params,
                'value': t.value,
                'state': t.state.name,
            }
            for t in study.trials
        ],
    }

    results_path = output_dir / 'sweep_results.json'
    with open(results_path, 'w') as f:
        json.dump(best, f, indent=2)

    print(f"Best F1-macro: {study.best_value:.4f}")
    print(f"Best params: {study.best_params}")
    print(f"Results saved to {results_path}")
    return best


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--n-trials', type=int, default=30)
    parser.add_argument('--seed', type=int, default=SEED)
    parser.add_argument('--output', type=Path, default=Path('artifacts/EXP-002/sweep'))
    args = parser.parse_args()

    run_sweep(args.n_trials, args.seed, args.output)
```

---

## 3. EXP-003 Grid Search Config

```python
# research-lab/phases/E-sweeps/sweep_exp003.py
"""
Deterministic grid search for EXP-003 — Flood-risk XGBoost.
Usage:
    python sweep_exp003.py --seed 42 --output artifacts/EXP-003/sweep/
"""
import itertools
import json
import numpy as np
from pathlib import Path

PARAM_GRID = {
    'n_estimators': [100, 200, 500],
    'max_depth': [3, 5, 7],
    'learning_rate': [0.01, 0.1],
}

SEED = 42


def deterministic_grid(param_grid: dict, seed: int) -> list[dict]:
    """Generate all grid combinations in a reproducible order."""
    rng = np.random.default_rng(seed)
    combos = list(itertools.product(*param_grid.values()))
    rng.shuffle(combos)  # deterministic shuffle
    return [dict(zip(param_grid.keys(), c)) for c in combos]


def run_grid_search(seed: int, output_dir: Path) -> dict:
    output_dir.mkdir(parents=True, exist_ok=True)
    grid = deterministic_grid(PARAM_GRID, seed)

    results = []
    for i, params in enumerate(grid):
        # auc = train_xgboost_cv(params, seed=seed)  # replace with actual call
        auc = 0.0  # placeholder
        results.append({'trial': i, 'params': params, 'auc_roc': auc})
        print(f"Trial {i+1}/{len(grid)}: {params} → AUC={auc:.4f}")

    best = max(results, key=lambda r: r['auc_roc'])
    summary = {
        'exp_id': 'EXP-003',
        'sweep_seed': seed,
        'n_trials': len(grid),
        'best_params': best['params'],
        'best_auc_roc': best['auc_roc'],
        'all_trials': results,
    }

    results_path = output_dir / 'sweep_results.json'
    with open(results_path, 'w') as f:
        json.dump(summary, f, indent=2)
    return summary


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--seed', type=int, default=SEED)
    parser.add_argument('--output', type=Path, default=Path('artifacts/EXP-003/sweep'))
    args = parser.parse_args()
    run_grid_search(args.seed, args.output)
```

---

## 4. Budget-Aware Scheduling

| Constraint | EXP-002 | EXP-003 |
|-----------|---------|---------|
| Max trials | 30 | 18 (full grid) |
| Max wall time | 4 hours | 2 hours |
| Early stopping | MedianPruner (epoch 5+) | N/A (grid) |
| Seed | 42 | 42 |
| Cost estimate | ~$2.50 GPU | ~$0.50 CPU |

### Early Stopping Rule (EXP-002)

MedianPruner halts a trial at intermediate epoch `e` if the trial's intermediate value is worse than the median of completed trials at the same epoch. Warmup: first 5 epochs never pruned.

---

## 5. Results → Registry Integration

After a sweep completes, update `registry.json`:

```python
# research-lab/phases/E-sweeps/update_registry.py
import json
from pathlib import Path

def update_registry_with_sweep(exp_id: str, sweep_results: dict) -> None:
    registry_path = Path('research-lab/registry.json')
    with open(registry_path) as f:
        registry = json.load(f)

    for exp in registry['experiments']:
        if exp['id'] == exp_id:
            exp['best_hyperparameters'] = sweep_results['best_params']
            exp['sweep_n_trials'] = sweep_results['n_trials']
            exp['sweep_seed'] = sweep_results['sweep_seed']
            break

    with open(registry_path, 'w') as f:
        json.dump(registry, f, indent=2)
    print(f"Registry updated for {exp_id}")
```
