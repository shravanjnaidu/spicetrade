package com.spicetrade.app.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.lifecycle.viewmodel.compose.viewModel
import com.spicetrade.app.ui.screens.messages.MessagesListScreen
import com.spicetrade.app.ui.screens.products.ProductsListScreen
import com.spicetrade.app.ui.screens.profile.ProfileScreen
import com.spicetrade.app.ui.screens.seller.SellerDashboardScreen
import com.spicetrade.app.ui.screens.stores.StoresListScreen
import com.spicetrade.app.ui.screens.wishlist.WishlistScreen
import com.spicetrade.app.ui.theme.BrandRed
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.MessageViewModel

private data class Tab(val label: String, val icon: ImageVector)

@Composable
fun MainScreen(
    authViewModel: AuthViewModel,
    onLogout: () -> Unit,
    messageViewModel: MessageViewModel = viewModel()
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val isSeller = currentUser?.isSeller == true
    var selectedTab by remember { mutableIntStateOf(0) }
    val unreadCount by messageViewModel.unreadCount.collectAsState()

    LaunchedEffect(currentUser) {
        currentUser?.id?.let { messageViewModel.loadUnreadCount(it) }
    }

    val tabs = if (isSeller) {
        listOf(
            Tab("Home", Icons.Default.Home),
            Tab("Stores", Icons.Default.Store),
            Tab("Dashboard", Icons.Default.BarChart),
            Tab("Messages", Icons.Default.Message),
            Tab("Profile", Icons.Default.Person)
        )
    } else {
        listOf(
            Tab("Home", Icons.Default.Home),
            Tab("Stores", Icons.Default.Store),
            Tab("Wishlist", Icons.Default.Favorite),
            Tab("Messages", Icons.Default.Message),
            Tab("Profile", Icons.Default.Person)
        )
    }

    Scaffold(
        bottomBar = {
            NavigationBar(containerColor = MaterialTheme.colorScheme.surface) {
                tabs.forEachIndexed { index, tab ->
                    NavigationBarItem(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        icon = {
                            if (tab.label == "Messages" && unreadCount > 0) {
                                BadgedBox(badge = { Badge { Text(unreadCount.toString()) } }) {
                                    Icon(tab.icon, contentDescription = tab.label)
                                }
                            } else {
                                Icon(tab.icon, contentDescription = tab.label)
                            }
                        },
                        label = { Text(tab.label) },
                        colors = NavigationBarItemDefaults.colors(indicatorColor = BrandRed.copy(alpha = 0.15f))
                    )
                }
            }
        }
    ) { innerPadding ->
        Box(modifier = Modifier.padding(innerPadding)) {
            when (selectedTab) {
                0 -> ProductsListScreen(authViewModel = authViewModel)
                1 -> StoresListScreen(authViewModel = authViewModel)
                2 -> if (isSeller) SellerDashboardScreen(authViewModel = authViewModel)
                     else WishlistScreen(authViewModel = authViewModel)
                3 -> MessagesListScreen(authViewModel = authViewModel, messageViewModel = messageViewModel)
                4 -> ProfileScreen(authViewModel = authViewModel, onLogout = onLogout)
            }
        }
    }
}
