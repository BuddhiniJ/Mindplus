import json
from services.model_metrics_service import get_fingerprint_model_metrics


def main():
    metrics = get_fingerprint_model_metrics()
    print(json.dumps(metrics, indent=2))


if __name__ == "__main__":
    main()
