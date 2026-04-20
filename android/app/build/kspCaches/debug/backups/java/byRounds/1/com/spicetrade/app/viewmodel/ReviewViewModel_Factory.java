package com.spicetrade.app.viewmodel;

import com.spicetrade.app.data.repository.ReviewRepository;
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
public final class ReviewViewModel_Factory implements Factory<ReviewViewModel> {
  private final Provider<ReviewRepository> repositoryProvider;

  public ReviewViewModel_Factory(Provider<ReviewRepository> repositoryProvider) {
    this.repositoryProvider = repositoryProvider;
  }

  @Override
  public ReviewViewModel get() {
    return newInstance(repositoryProvider.get());
  }

  public static ReviewViewModel_Factory create(Provider<ReviewRepository> repositoryProvider) {
    return new ReviewViewModel_Factory(repositoryProvider);
  }

  public static ReviewViewModel newInstance(ReviewRepository repository) {
    return new ReviewViewModel(repository);
  }
}
