package com.spicetrade.app.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.spicetrade.app.R
import com.spicetrade.app.data.api.ApiConfig
import com.spicetrade.app.ui.screens.advertiser.AdvertiserDashboardScreen
import com.spicetrade.app.ui.screens.messages.MessagesListScreen
import com.spicetrade.app.ui.screens.products.ProductsListScreen
import com.spicetrade.app.ui.screens.profile.ProfileScreen
import com.spicetrade.app.ui.screens.requirements.PostRequirementScreen
import com.spicetrade.app.ui.screens.seller.SellerDashboardScreen
import com.spicetrade.app.ui.screens.stores.StoresListScreen
import com.spicetrade.app.ui.screens.wishlist.WishlistScreen
import com.spicetrade.app.ui.theme.BrandDark
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.ui.screens.cart.CartScreen
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.CartViewModel
import com.spicetrade.app.viewmodel.MessageViewModel
import kotlinx.coroutines.launch

private data class Tab(val label: String, val icon: ImageVector)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    authViewModel: AuthViewModel,
    onLogout: () -> Unit,
    messageViewModel: MessageViewModel = hiltViewModel(),
    cartViewModel: CartViewModel = hiltViewModel()
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val isSeller = currentUser?.isSeller == true
    val isAdvertiser = currentUser?.isAdvertiser == true
    var selectedTab by remember { mutableIntStateOf(0) }
    var showPostRequirement by remember { mutableStateOf(false) }
    var showCart by remember { mutableStateOf(false) }
    val unreadCount by messageViewModel.unreadCount.collectAsState()
    val drawerState = rememberDrawerState(DrawerValue.Closed)
    val scope = rememberCoroutineScope()

    LaunchedEffect(currentUser) {
        currentUser?.id?.let { messageViewModel.loadUnreadCount(it) }
    }

    if (showPostRequirement) {
        PostRequirementScreen(
            authViewModel = authViewModel,
            onBack = { showPostRequirement = false },
            onSuccess = { showPostRequirement = false }
        )
        return
    }

    if (showCart) {
        CartScreen(
            cartViewModel = cartViewModel,
            onBack = { showCart = false }
        )
        return
    }

    val tabs = when {
        isAdvertiser -> listOf(
            Tab("Home",      Icons.Default.Home),
            Tab("My Ads",    Icons.Default.Campaign),
            Tab("Messages",  Icons.Default.Message),
            Tab("Profile",   Icons.Default.Person)
        )
        isSeller -> listOf(
            Tab("Home",      Icons.Default.Home),
            Tab("Stores",    Icons.Default.Store),
            Tab("Dashboard", Icons.Default.BarChart),
            Tab("Messages",  Icons.Default.Message),
            Tab("Profile",   Icons.Default.Person)
        )
        else -> listOf(
            Tab("Home",     Icons.Default.Home),
            Tab("Stores",   Icons.Default.Store),
            Tab("Wishlist", Icons.Default.Favorite),
            Tab("Messages", Icons.Default.Message),
            Tab("Profile",  Icons.Default.Person)
        )
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet(drawerContainerColor = Color.White) {
                BigSpiceDrawerContent(
                    currentUserName = currentUser?.name ?: "Guest",
                    currentUserEmail = currentUser?.email ?: "",
                    currentUserAvatarUrl = currentUser?.profilePicture?.let {
                        if (it.startsWith("http")) it else "${ApiConfig.BASE_URL}/uploads/$it"
                    },
                    isSeller = isSeller,
                    isAdvertiser = isAdvertiser,
                    unreadCount = unreadCount,
                    onClose = { scope.launch { drawerState.close() } },
                    onNavigate = { tabIndex ->
                        scope.launch { drawerState.close() }
                        selectedTab = tabIndex
                    },
                    onPostRequirement = {
                        scope.launch { drawerState.close() }
                        showPostRequirement = true
                    },
                    onLogout = {
                        scope.launch { drawerState.close() }
                        onLogout()
                    }
                )
            }
        }
    ) {
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
                            colors = NavigationBarItemDefaults.colors(indicatorColor = BrandOrange.copy(alpha = 0.18f))
                        )
                    }
                }
            },
            floatingActionButton = {
                if (selectedTab == 0 && !isAdvertiser) {
                    FloatingActionButton(
                        onClick = { showPostRequirement = true },
                        containerColor = BrandOrange,
                        contentColor = Color.White
                    ) {
                        Icon(Icons.Default.PostAdd, contentDescription = "Post Requirement")
                    }
                }
            }
        ) { innerPadding ->
            Box(modifier = Modifier.padding(innerPadding)) {
                when {
                    isAdvertiser -> when (selectedTab) {
                        0 -> ProductsListScreen(
                            authViewModel = authViewModel,
                            cartViewModel = cartViewModel,
                            onPostRequirement = { },
                            onMenuOpen = { scope.launch { drawerState.open() } },
                            onViewAllStores = { },
                            onCartClick = { showCart = true },
                            onContactSeller = { _, _ -> selectedTab = 2 }
                        )
                        1 -> AdvertiserDashboardScreen(authViewModel = authViewModel)
                        2 -> MessagesListScreen(authViewModel = authViewModel, messageViewModel = messageViewModel)
                        3 -> ProfileScreen(authViewModel = authViewModel, onLogout = onLogout)
                    }
                    else -> when (selectedTab) {
                        0 -> ProductsListScreen(
                            authViewModel = authViewModel,
                            cartViewModel = cartViewModel,
                            onPostRequirement = { showPostRequirement = true },
                            onMenuOpen = { scope.launch { drawerState.open() } },
                            onViewAllStores = { selectedTab = 1 },
                            onCartClick = { showCart = true },
                            onContactSeller = { sellerId, adId ->
                                currentUser?.id?.let { buyerId ->
                                    messageViewModel.createConversation(buyerId, sellerId, adId)
                                }
                                selectedTab = if (isSeller) 3 else 3
                            }
                        )
                        1 -> StoresListScreen(authViewModel = authViewModel)
                        2 -> if (isSeller) SellerDashboardScreen(authViewModel = authViewModel)
                             else WishlistScreen(authViewModel = authViewModel)
                        3 -> MessagesListScreen(authViewModel = authViewModel, messageViewModel = messageViewModel)
                        4 -> ProfileScreen(authViewModel = authViewModel, onLogout = onLogout)
                    }
                }
            }
        }
    }
}

// ── Drawer content ─────────────────────────────────────────────────────────────
@Composable
private fun BigSpiceDrawerContent(
    currentUserName: String,
    currentUserEmail: String,
    currentUserAvatarUrl: String?,
    isSeller: Boolean,
    isAdvertiser: Boolean = false,
    unreadCount: Int,
    onClose: () -> Unit,
    onNavigate: (Int) -> Unit,
    onPostRequirement: () -> Unit,
    onLogout: () -> Unit
) {
    Column(modifier = Modifier.fillMaxSize().verticalScroll(rememberScrollState())) {

        // ── Header ─────────────────────────────────────────────────────────────
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(BrandOrange)
                .padding(horizontal = 16.dp, vertical = 18.dp)
        ) {
            Column {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.Top
                ) {
                    Image(
                        painter = painterResource(R.drawable.bigspicelogo),
                        contentDescription = "BigSpice",
                        modifier = Modifier.size(44.dp).clip(RoundedCornerShape(10.dp))
                    )
                    IconButton(onClick = onClose, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.Close, null, tint = Color.White.copy(0.85f))
                    }
                }
                Spacer(Modifier.height(14.dp))
                Box(
                    modifier = Modifier.size(52.dp).clip(CircleShape)
                        .background(Color.White.copy(0.2f)),
                    contentAlignment = Alignment.Center
                ) {
                    if (currentUserAvatarUrl != null) {
                        AsyncImage(
                            model = currentUserAvatarUrl,
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize().clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                    } else {
                        Icon(Icons.Default.Person, null, tint = Color.White, modifier = Modifier.size(28.dp))
                    }
                }
                Spacer(Modifier.height(10.dp))
                Text(currentUserName, fontSize = 16.sp, fontWeight = FontWeight.Bold, color = Color.White)
                if (currentUserEmail.isNotEmpty()) {
                    Text(currentUserEmail, fontSize = 12.sp, color = Color.White.copy(0.75f))
                }
            }
        }

        Spacer(Modifier.height(6.dp))

        // ── Main menu ──────────────────────────────────────────────────────────
        DrawerSection("MAIN MENU") {
            DrawerMenuItem(Icons.Default.Home, "Home") { onNavigate(0) }
            DrawerMenuItem(Icons.Default.Store, "Browse Suppliers") { onNavigate(1) }
            DrawerMenuItem(
                icon = Icons.Default.PostAdd,
                label = "Post Buy Requirement",
                subLabel = "Tell us what you need",
                accent = BrandOrange
            ) { onPostRequirement() }
        }

        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))

        // ── My Account ─────────────────────────────────────────────────────────
        DrawerSection("MY ACCOUNT") {
            val profileTabIdx = if (isAdvertiser) 3 else 4
            val messagesTabIdx = if (isAdvertiser) 2 else 3
            DrawerMenuItem(Icons.Default.Person, "My Profile") { onNavigate(profileTabIdx) }
            DrawerMenuItem(
                icon = Icons.Default.Message,
                label = "Messages",
                badge = if (unreadCount > 0) unreadCount.toString() else null
            ) { onNavigate(messagesTabIdx) }
            if (!isSeller && !isAdvertiser) {
                DrawerMenuItem(Icons.Default.Favorite, "My Wishlist") { onNavigate(2) }
            }
            if (isSeller) {
                DrawerMenuItem(Icons.Default.BarChart, "Seller Dashboard") { onNavigate(2) }
            }
            if (isAdvertiser) {
                DrawerMenuItem(Icons.Default.Campaign, "My Banner Ads") { onNavigate(1) }
            }
        }

        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))

        // ── Business tools ─────────────────────────────────────────────────────
        DrawerSection("BUSINESS") {
            DrawerMenuItem(Icons.Default.Verified, "Verified Suppliers") { onNavigate(1) }
            DrawerMenuItem(Icons.Default.ListAlt, "My Requirements") { onNavigate(0) }
            DrawerMenuItem(Icons.Default.TrendingUp, "Trending Products") { onNavigate(0) }
        }

        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))

        // ── Help & others ──────────────────────────────────────────────────────
        DrawerSection("HELP & OTHERS") {
            DrawerMenuItem(Icons.Default.Help, "Help & Support") { }
            DrawerMenuItem(Icons.Default.Star, "Rate BigSpice") { }
            DrawerMenuItem(Icons.Default.Share, "Share App") { }
        }

        HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))

        DrawerMenuItem(
            icon = Icons.Default.Logout,
            label = "Logout",
            textColor = Color(0xFFD32F2F)
        ) { onLogout() }

        Spacer(Modifier.height(24.dp))
    }
}

@Composable
private fun DrawerSection(title: String, content: @Composable () -> Unit) {
    Text(
        title,
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        color = Color(0xFF9E9E9E),
        modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
        letterSpacing = 1.sp
    )
    content()
}

@Composable
private fun DrawerMenuItem(
    icon: ImageVector,
    label: String,
    subLabel: String? = null,
    badge: String? = null,
    accent: Color? = null,
    textColor: Color = Color(0xFF212121),
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Box(
            modifier = Modifier
                .size(36.dp)
                .clip(RoundedCornerShape(8.dp))
                .background((accent ?: Color(0xFF757575)).copy(0.1f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(icon, null, tint = accent ?: Color(0xFF555555), modifier = Modifier.size(20.dp))
        }
        Spacer(Modifier.width(14.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(label, fontSize = 14.sp, fontWeight = FontWeight.Medium, color = textColor)
            if (subLabel != null) {
                Text(subLabel, fontSize = 11.sp, color = Color.Gray)
            }
        }
        if (badge != null) {
            Surface(shape = CircleShape, color = BrandOrange) {
                Text(
                    badge,
                    fontSize = 11.sp, color = Color.White,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp),
                    fontWeight = FontWeight.Bold
                )
            }
        } else {
            Icon(Icons.Default.ChevronRight, null, tint = Color(0xFFBDBDBD), modifier = Modifier.size(16.dp))
        }
    }
}

