# helm charts to manage webrtc-observer.org

> [!WARNING]
> Work in progress!

## Installation

### Requirements

- cert-manager ([docs](https://cert-manager.io/docs/installation/))
```console
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.17.1/cert-manager.yaml
```

- nginx-controller ([docs](https://kubernetes.github.io/ingress-nginx/deploy/#gce-gke))
```console
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.12.0/deploy/static/provider/cloud/deploy.yaml
kubectl patch configmap -n ingress-nginx ingress-nginx-controller -p '{"data":{"allow-snippet-annotations": "true"}}'
```

- stunner-gateway-operator ([docs](https://docs.l7mp.io/en/stable/INSTALL/))
```console
helm repo add stunner https://l7mp.io/stunner
helm repo update
helm install stunner-gateway-operator stunner/stunner-gateway-operator --create-namespace --namespace=stunner-system
```

- prometheus and grafana
```console
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
helm install prometheus prometheus-community/kube-prometheus-stack --namespace monitoring --create-namespace
```
- edit grafana deployment:
```patch
+        - name: GF_SERVER_ROOT_URL
+          value: /g
+        - name: GF_SERVER_SERVE_FROM_SUB_PATH
+          value: "true"
+        - name: GF_SECURITY_ALLOW_EMBEDDING
+          value: "true"
        image: docker.io/grafana/grafana:11.5.1
        imagePullPolicy: IfNotPresent
```

### Install

```console
helm install webrtc-observer-org charts/webrtc-observer-org
```


## TODOs

- [ ] add chart dependencies
