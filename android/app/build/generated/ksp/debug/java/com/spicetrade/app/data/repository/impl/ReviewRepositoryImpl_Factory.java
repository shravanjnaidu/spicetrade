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
public final class ReviewRepositoryImpl_Factory implements Factory<ReviewRepositoryImpl> {
  private final Provider<ApiService> apiServiceProvider;

  public ReviewRepositoryImpl_Factory(Provider<ApiService> apiServiceProvider) {
    this.apiServiceProvider = apiServiceProvider;
  }

  @Override
  public ReviewRepositoryImpl get() {
    return newInstance(apiServiceProvider.get());
  }

  public static ReviewRepositoryImpl_Factory create(Provider<ApiService> apiServiceProvider) {
    return new ReviewRepositoryImpl_Factory(apiServiceProvider);
  }

  public static ReviewRepositoryImpl newInstance(ApiService apiService) {
    return new ReviewRepositoryImpl(apiService);
  }
}
