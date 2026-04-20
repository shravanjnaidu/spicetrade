package com.spicetrade.app.data.repository.impl;

import com.spicetrade.app.data.api.ApiService;
import dagger.internal.DaggerGenerated;
import dagger.internal.Factory;
import dagger.internal.QualifierMetadata;
import dagger.internal.ScopeMetadata;
import javax.annotation.processing.Generated;
import javax.inject.Provider;

@ScopeMetadata
@QualifierMetadata
@DaggerGenerated
@Generated(
    value = "dagger.internal.codegen.ComponentProcessor",
    comments = "https://dagger.dev"
)
@SuppressWarnings({
    "unchecked",
    "rawtypes",
    "KotlinInternal",
    "KotlinInternalInJava",
    "cast"
})
public final class ProductRepositoryImpl_Factory implements Factory<ProductRepositoryImpl> {
  private final Provider<ApiService> apiServiceProvider;

  public ProductRepositoryImpl_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public ProductRepositoryImpl get() {
    return newInstance(apiServiceProvider.get());
  }

  public static ProductRepositoryImpl_Factory create(Provider<ApiService> apiServiceProvider) {
    return new ProductRepositoryImpl_Factory(apiServiceProvider);
  }

  public static ProductRepositoryImpl newInstance(ApiService apiService) {
    return new ProductRepositoryImpl(apiService);
  }
}
