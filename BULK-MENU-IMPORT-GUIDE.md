# Bulk Menu CSV Import

In an establishment owner account: Business Hub > Menu Management > Download CSV template / Import menu CSV. Import supports up to 20 rows each time, up to 80 active items per establishment.

CSV columns: `Item Name,Description,Price,Category,Available,Option Groups JSON`. `Available` accepts TRUE/FALSE, YES/NO, 1/0. Price in pesos, not centavos. Optional option groups JSON is an array of groups with `{name,required,maxSelect,choices:[{name,price,available}]}`; prices in pesos.

The CSV importer shows a preview and requires confirmation. Each item is sent through the existing owner-verified server-side menu endpoint. Failed/partial imports may leave already saved items in place; remove those rows before retrying. No image URLs or non-image upload accepted via import: use the existing Add Photo editor separately.

**Security limitations:** Browser-based CSV parsing does not grant extra database permissions; the existing server menu API verifies ownership and validates items. Import maximum 20 rows and file maximum 100 KB. Existing menu items are not overwritten. Large imports may be rate-limited.

**Test after deployment:** Confirm on a demo owner account, import 2 items, inspect order options, verify duplicate rejection, verify non-owner access, and check mobile layout. No live deployment verification performed here.
