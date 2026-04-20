package com.spicetrade.app.ui.screens.requirements

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.spicetrade.app.ui.theme.BrandAmber
import com.spicetrade.app.ui.theme.BrandDark
import com.spicetrade.app.ui.theme.BrandOrange
import com.spicetrade.app.viewmodel.AuthViewModel
import com.spicetrade.app.viewmodel.ProductViewModel

private val REQUIREMENT_CATEGORIES = listOf(
    "Electronics", "Textiles", "Agriculture", "Machinery", "Chemicals",
    "Food & Spices", "Furniture", "Automobiles", "Healthcare",
    "Construction", "Services", "Other"
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PostRequirementScreen(
    authViewModel: AuthViewModel,
    productViewModel: ProductViewModel = hiltViewModel(),
    onBack: () -> Unit,
    onSuccess: () -> Unit
) {
    var title       by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category    by remember { mutableStateOf("") }
    var quantity    by remember { mutableStateOf("") }
    var budget      by remember { mutableStateOf("") }
    var unit        by remember { mutableStateOf("") }

    var categoryExpanded by remember { mutableStateOf(false) }
    var isSubmitting     by remember { mutableStateOf(false) }
    var errorMsg         by remember { mutableStateOf<String?>(null) }

    val currentUser by authViewModel.currentUser.collectAsState()

    Column(modifier = Modifier.fillMaxSize().background(Color.White)) {

        // ── Header ─────────────────────────────────────────────────────────────
        Column(modifier = Modifier.fillMaxWidth().background(Color.White)) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 4.dp, vertical = 4.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back", tint = BrandOrange)
                    }
                    Text(
                        "Post Buy Requirement",
                        fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color(0xFF222222)
                    )
                }
            }
            HorizontalDivider(color = Color(0xFFE9E9E9), thickness = 1.dp)
        }

        // ── Info card ─────────────────────────────────────────────────────────
        Surface(
            modifier = Modifier.fillMaxWidth().padding(14.dp),
            shape = RoundedCornerShape(10.dp),
            color = BrandAmber.copy(0.12f),
            border = androidx.compose.foundation.BorderStroke(1.dp, BrandAmber.copy(0.3f))
        ) {
            Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.Top) {
                Icon(Icons.Default.Info, contentDescription = null, tint = BrandAmber,
                    modifier = Modifier.size(20.dp).padding(top = 1.dp))
                Spacer(Modifier.width(8.dp))
                Text(
                    "Post your buying requirements and get quotes from hundreds of verified suppliers across India.",
                    fontSize = 13.sp, color = Color.DarkGray, lineHeight = 18.sp
                )
            }
        }

        // ── Form ──────────────────────────────────────────────────────────────
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 14.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {

            // Title
            RequirementField("Product / Service Required *") {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    placeholder = { Text("e.g. Black Pepper 500kg, Steel Pipes…", color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        cursorColor = BrandOrange
                    )
                )
            }

            // Category
            RequirementField("Category *") {
                ExposedDropdownMenuBox(
                    expanded = categoryExpanded,
                    onExpandedChange = { categoryExpanded = !categoryExpanded }
                ) {
                    OutlinedTextField(
                        value = category,
                        onValueChange = {},
                        readOnly = true,
                        placeholder = { Text("Select category", color = Color.Gray) },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded) },
                        modifier = Modifier.fillMaxWidth().menuAnchor(),
                        shape = RoundedCornerShape(8.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = BrandOrange,
                            cursorColor = BrandOrange
                        )
                    )
                    ExposedDropdownMenu(
                        expanded = categoryExpanded,
                        onDismissRequest = { categoryExpanded = false }
                    ) {
                        REQUIREMENT_CATEGORIES.forEach { cat ->
                            DropdownMenuItem(
                                text = { Text(cat) },
                                onClick = { category = cat; categoryExpanded = false }
                            )
                        }
                    }
                }
            }

            // Description
            RequirementField("Description / Specifications") {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = { Text("Describe your requirements in detail…", color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth().height(110.dp),
                    maxLines = 5,
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        cursorColor = BrandOrange
                    )
                )
            }

            // Quantity + Unit row
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Column(modifier = Modifier.weight(1.5f)) {
                    RequirementField("Quantity") {
                        OutlinedTextField(
                            value = quantity,
                            onValueChange = { quantity = it },
                            placeholder = { Text("e.g. 100", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandOrange,
                                cursorColor = BrandOrange
                            )
                        )
                    }
                }
                Column(modifier = Modifier.weight(1f)) {
                    RequirementField("Unit") {
                        OutlinedTextField(
                            value = unit,
                            onValueChange = { unit = it },
                            placeholder = { Text("kg / pcs", color = Color.Gray) },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(8.dp),
                            colors = OutlinedTextFieldDefaults.colors(
                                focusedBorderColor = BrandOrange,
                                cursorColor = BrandOrange
                            )
                        )
                    }
                }
            }

            // Budget
            RequirementField("Max Budget (₹)") {
                OutlinedTextField(
                    value = budget,
                    onValueChange = { budget = it },
                    placeholder = { Text("e.g. 50000", color = Color.Gray) },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    leadingIcon = { Text("₹", fontSize = 16.sp, color = Color.Gray, modifier = Modifier.padding(start = 12.dp)) },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    shape = RoundedCornerShape(8.dp),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = BrandOrange,
                        cursorColor = BrandOrange
                    )
                )
            }

            // Error
            if (errorMsg != null) {
                Text(errorMsg!!, color = MaterialTheme.colorScheme.error, fontSize = 13.sp)
            }

            // Submit button
            Button(
                onClick = {
                    if (title.isBlank()) { errorMsg = "Please enter a product/service name"; return@Button }
                    if (category.isBlank()) { errorMsg = "Please select a category"; return@Button }
                    errorMsg = null
                    isSubmitting = true

                    val body = buildMap<String, Any?> {
                        put("title", title.trim())
                        put("description", description.trim().ifBlank { title.trim() })
                        put("category", category)
                        put("listingType", "requirement")
                        put("price", budget.toDoubleOrNull())
                        put("unit", unit.trim().ifBlank { null })
                        put("quantity", quantity.trim().ifBlank { null })
                        put("userId", currentUser?.id)
                    }
                    productViewModel.createListing(body)
                    isSubmitting = false
                    onSuccess()
                },
                modifier = Modifier.fillMaxWidth().height(50.dp),
                shape = RoundedCornerShape(10.dp),
                enabled = !isSubmitting,
                colors = ButtonDefaults.buttonColors(containerColor = BrandOrange)
            ) {
                if (isSubmitting) {
                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                } else {
                    Icon(Icons.Default.Send, null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Submit Requirement", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                }
            }

            Spacer(Modifier.height(24.dp))
        }
    }
}

@Composable
private fun RequirementField(label: String, content: @Composable () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
        Text(label, fontSize = 13.sp, fontWeight = FontWeight.SemiBold, color = Color(0xFF444444))
        content()
    }
}
