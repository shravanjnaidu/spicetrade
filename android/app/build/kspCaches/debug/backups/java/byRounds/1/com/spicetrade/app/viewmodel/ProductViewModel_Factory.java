package com.spicetrade.app.viewmodel;

import com.spicetrade.app.data.repository.ProductRepository;
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
public final class ProductViewModel_Factory implements Factory<ProductViewModel> {
  private final Provider<ProductRepository> repositoryProvider;

  public ProductViewModel_Factory(Provider<ProductRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public ProductViewModel get() {
    return newInstance(repositoryProvider.get());
  }

  public static ProductViewModel_Factory create(Provider<ProductRepository> repositoryProvider) {
    return new ProductViewModel_Factory(repositoryProvider);
  }

  public static ProductViewModel newInstance(ProductRepository repository) {
    return new ProductViewModel(repository);
  }
}
