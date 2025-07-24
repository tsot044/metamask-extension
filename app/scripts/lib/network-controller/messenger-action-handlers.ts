import log from 'loglevel';
import { Hex, hexToNumber, Json } from '@metamask/utils';
import { JsonRpcError } from '@metamask/rpc-errors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { onlyKeepHost } from '../../../../shared/lib/only-keep-host';
import MetaMetricsController from '../../controllers/metametrics-controller';
import { shouldCreateRpcServiceEvents } from './utils';

/**
 * Called when an endpoint is determined to be "unavailable". Creates a Segment
 * event so we can understand failures better and so that we can automatically
 * activate Quicknode when Infura is down.
 *
 * Note that in production we do not create events *every* time an endpoint is
 * unavailable. In the case where the endpoint is truly down, this would create
 * millions of events and we would blow past our Segment quota. Instead we only
 * create an event 1% of the time.
 *
 * @param args - The arguments.
 * @param args.chainId - The chain ID that the endpoint represents.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.trackEvent - The function that will create the Segment event.
 * @param args.metaMetricsId - The MetaMetrics ID of the user.
 */
export function onRpcEndpointUnavailable({
  chainId,
  endpointUrl,
  error,
  trackEvent,
  metaMetricsId,
}: {
  chainId: Hex;
  endpointUrl: string;
  error: unknown;
  infuraProjectId: string;
  trackEvent: MetaMetricsController['trackEvent'];
  metaMetricsId: string | null;
}): void {
  if (!shouldCreateRpcServiceEvents(error, metaMetricsId)) {
    return;
  }

  const properties: Json = {
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id_caip: `eip155:${hexToNumber(chainId)}`,
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    rpc_endpoint_url: onlyKeepHost(endpointUrl),
  };
  if (error instanceof JsonRpcError) {
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    properties.http_status_code = error.data.httpStatus;
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    properties.rpc_error_code = error.code;
  }

  log.debug(
    `Creating Segment event "${
      MetaMetricsEventName.RpcServiceUnavailable
    }" with ${JSON.stringify(properties)}`,
  );
  trackEvent({
    category: MetaMetricsEventCategory.Network,
    event: MetaMetricsEventName.RpcServiceUnavailable,
    properties,
  });
}

/**
 * Called when an endpoint is determined to be "degraded". Creates a Segment
 * event so we can understand failures better.
 *
 * Note that in production we do not create events *every* time an endpoint is
 * unavailable. In the case where the endpoint is down, this would create
 * millions of events and we would blow past our Segment quota. Instead we only
 * create an event 1% of the time.
 *
 * @param args - The arguments.
 * @param args.chainId - The chain ID that the endpoint represents.
 * @param args.error - The connection or response error encountered after making
 * a request to the RPC endpoint.
 * @param args.endpointUrl - The URL of the endpoint.
 * @param args.infuraProjectId - Our Infura project ID.
 * @param args.trackEvent - The function that will create the Segment event.
 * @param args.metaMetricsId - The MetaMetrics ID of the user.
 */
export function onRpcEndpointDegraded({
  chainId,
  endpointUrl,
  error,
  trackEvent,
  metaMetricsId,
}: {
  chainId: Hex;
  endpointUrl: string;
  error: unknown;
  infuraProjectId: string;
  trackEvent: MetaMetricsController['trackEvent'];
  metaMetricsId: string | null;
}): void {
  if (!shouldCreateRpcServiceEvents(error, metaMetricsId)) {
    return;
  }

  const properties: Json = {
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    chain_id_caip: `eip155:${hexToNumber(chainId)}`,
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    rpc_endpoint_url: onlyKeepHost(endpointUrl),
  };
  if (error instanceof JsonRpcError) {
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    properties.http_status_code = error.data.httpStatus;
    // The case is intentional here.
    // eslint-disable-next-line @typescript-eslint/naming-convention
    properties.rpc_error_code = error.code;
  }

  log.debug(
    `Creating Segment event "${
      MetaMetricsEventName.RpcServiceDegraded
    }" with ${JSON.stringify(properties)}`,
  );
  trackEvent({
    category: MetaMetricsEventCategory.Network,
    event: MetaMetricsEventName.RpcServiceDegraded,
    properties,
  });
}
