import React from 'react';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { endTrace, trace, TraceName } from '../../../shared/lib/trace';

type ImportedModule =
  | ComponentModuleWithNamedExport
  | WrappedComponentModule
  | ComponentModule;

type ReactComponentType = React.ComponentType<any>;

type ComponentModuleWithNamedExport = {
  [componentName in string as componentName extends 'default'
    ? never
    : componentName]: ReactComponentType;
};

function hasDefaultExport(
  module: Record<string, unknown>,
): module is { default: unknown } {
  return Boolean(
    'default' in module && typeof module.default === 'object' && module.default,
  );
}

type WrappedComponentModule = {
  default: {
    WrappedComponent: ReactComponentType;
  };
};

type ComponentModule = {
  default: ReactComponentType;
};

// This only has to happen once per app load, so do it outside a function
const lazyLoadSubSampleRate = getManifestFlags().sentry?.lazyLoadSubSampleRate;

/**
 * A wrapper around React.lazy that adds two things:
 * 1. Sentry tracing for how long it takes to load the component (not render, just load)
 * 2. React.lazy can only deal with default exports, but the wrapper can handle named exports too
 *
 * @param fn - an import of the form `() => import('AAA')`
 */
export function mmLazy<InputType extends () => Promise<ImportedModule>>(
  fn: InputType,
) {
  return React.lazy(async () => {
    // We can't start the trace here because we don't have the componentName yet, so we just hold the startTime
    const startTime = Date.now();

    const importedModule = await fn();
    const { componentName, component } =
      parseImportedComponent<ImportedModule>(importedModule);

    // Only trace load time of lazy-loaded components if the manifestFlag is set, and then do it by Math.random probability
    if (lazyLoadSubSampleRate && Math.random() < lazyLoadSubSampleRate) {
      trace({
        name: TraceName.LazyLoadComponent,
        data: { componentName },
        startTime,
      });

      endTrace({ name: TraceName.LazyLoadComponent });
    }

    return component;
  });
}

function parseImportedComponent<ModuleWithComponentType extends ImportedModule>(
  importedModule: NoInfer<ModuleWithComponentType>,
): {
  componentName: string; // TODO: in many circumstances, the componentName gets minified
  component: ComponentModule | WrappedComponentModule;
} {
  let componentName: string;

  // If there's no default export
  if (!hasDefaultExport(importedModule)) {
    const keys = Object.keys(importedModule);

    // If there's only one named export
    if (keys.length === 1) {
      [componentName] = keys;

      return {
        componentName,
        // Force the component to be the default export
        component: {
          default: importedModule[
            componentName as keyof typeof importedModule
          ] as ComponentModuleWithNamedExport[string],
        },
      };
    }
    // If there are multiple named exports, this isn't good for tree-shaking, so throw an error
    throw new Error(
      'mmLazy: You cannot lazy-load a component when there are multiple exported components in one file',
    );
  }

  if ('WrappedComponent' in importedModule.default) {
    // If there's a wrapped component, we don't want to see the name reported as `withRouter(Connect(AAA))` we want just `AAA`
    componentName = importedModule.default.WrappedComponent.name ?? '';
  } else {
    componentName =
      (importedModule.default.name || importedModule.default.displayName) ?? '';
  }

  return {
    componentName,
    component: importedModule,
  };
}
