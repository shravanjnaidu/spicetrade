package com.spicetrade.app.viewmodel;

import com.spicetrade.app.data.repository.WishlistRepository;
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
public final class WishlistViewModel_Factory implements Factory<WishlistViewModel> {
  private final Provider<WishlistRepository> repositoryProvider;

  public WishlistViewModel_Factory(Provider<WishlistRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public WishlistViewModel get() {
    return newInstance(repositoryProvider.get());
  }

  public static WishlistViewModel_Factory create(Provider<WishlistRepository> repositoryProvider) {
    return new WishlistViewModel_Factory(repositoryProvider);
  }

  public static WishlistViewModel newInstance(WishlistRepository repository) {
    return new WishlistViewModel(repository);
  }
}
