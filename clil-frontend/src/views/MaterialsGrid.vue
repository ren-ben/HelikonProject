<template>
  <div>
    <v-card elevation="1" class="mb-4">
      <v-card-title class="d-flex align-center flex-wrap">
        <v-icon color="primary" class="mr-2">mdi-folder-text-outline</v-icon>
        Meine Materialien
        <v-spacer></v-spacer>

        <v-btn-group variant="outlined" density="compact" class="mr-2 hidden-sm-and-down">
          <v-btn
            :color="viewMode === 'grid' ? 'primary' : undefined"
            @click="viewMode = 'grid'"
          >
            <v-icon>mdi-view-grid-outline</v-icon>
            <v-tooltip activator="parent" location="top">Kachelansicht</v-tooltip>
          </v-btn>
          <v-btn
            :color="viewMode === 'list' ? 'primary' : undefined"
            @click="viewMode = 'list'"
          >
            <v-icon>mdi-view-list-outline</v-icon>
            <v-tooltip activator="parent" location="top">Listenansicht</v-tooltip>
          </v-btn>
        </v-btn-group>

        <v-btn
          color="primary"
          to="/create"
          prepend-icon="mdi-plus"
          class="ml-2"
        >
          Neues Material
        </v-btn>
      </v-card-title>

      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="search"
              label="Materialien durchsuchen..."
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              density="compact"
              clearable
            ></v-text-field>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="typeFilter"
              :items="typeOptions"
              item-title="title"
              item-value="value"
              label="Typ"
              prepend-inner-icon="mdi-filter-variant"
              variant="outlined"
              hide-details
              density="compact"
              clearable
              chips
            ></v-select>
          </v-col>

          <v-col cols="12" md="3">
            <v-select
              v-model="subjectFilter"
              :items="subjectOptions"
              item-title="title"
              item-value="value"
              label="Fach"
              prepend-inner-icon="mdi-book-open-variant"
              variant="outlined"
              hide-details
              density="compact"
              clearable
              chips
            ></v-select>
          </v-col>

          <v-col cols="12" md="2">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              item-title="title"
              item-value="value"
              label="Sortieren"
              prepend-inner-icon="mdi-sort"
              variant="outlined"
              hide-details
              density="compact"
            ></v-select>
          </v-col>
        </v-row>

        <v-row dense class="mt-2">
          <v-col cols="12" class="d-flex align-center">
            <v-btn
              variant="text"
              @click="showAdvancedFilters = !showAdvancedFilters"
              density="compact"
              class="px-2"
            >
              {{ showAdvancedFilters ? 'Weniger Filter' : 'Erweiterte Filter' }}
              <v-icon end>{{ showAdvancedFilters ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
            </v-btn>
            
            <v-spacer></v-spacer>
            
            <v-switch
              v-model="favoritesOnly"
              color="warning"
              label="Nur Favoriten"
              hide-details
              density="compact"
              class="ml-auto"
            ></v-switch>
          </v-col>
        </v-row>
        
        <v-expand-transition>
          <v-card v-if="showAdvancedFilters" class="mt-3" variant="outlined">
            <v-card-text>
              <v-row dense>
                <v-col cols="12" md="4">
                  <v-combobox
                    v-model="tagFilters"
                    :items="availableTags"
                    label="Tags"
                    multiple
                    chips
                    closable-chips
                    variant="outlined"
                    density="compact"
                  ></v-combobox>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="languageLevelFilter"
                    :items="languageLevels"
                    item-title="title"
                    item-value="value"
                    label="Sprachniveau"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-select>
                </v-col>
                
                <v-col cols="12" md="4">
                  <v-select
                    v-model="dateFilter"
                    :items="dateFilters"
                    item-title="title"
                    item-value="value"
                    label="Zeitraum"
                    variant="outlined"
                    density="compact"
                    clearable
                  ></v-select>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-expand-transition>
      </v-card-text>
    </v-card>

    <!-- Batch Operations Bar -->
    <v-fade-transition>
      <v-sheet
        v-if="selected.length > 0"
        color="primary"
        class="d-flex align-center px-4 py-2 rounded-lg elevation-3"
        style="position: fixed; bottom: 16px; left: 50%; transform: translateX(-50%); z-index: 5; max-width: 90%;"
      >
        <span class="text-white mr-4">{{ selected.length }} Materialien ausgewählt</span>
        <v-btn variant="tonal" color="white" class="mr-2" @click="exportSelected">
          <v-icon start>mdi-export-variant</v-icon>
          Exportieren
        </v-btn>
        <v-btn variant="tonal" color="white" class="mr-2" @click="tagSelected">
          <v-icon start>mdi-tag-multiple</v-icon>
          Tags zuweisen
        </v-btn>
        <v-btn variant="tonal" color="error" @click="confirmDeleteSelected">
          <v-icon start>mdi-delete-outline</v-icon>
          Löschen
        </v-btn>
        <v-btn icon variant="text" color="white" class="ml-4" @click="selected = []">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-sheet>
    </v-fade-transition>

    <!-- Loading State -->
    <div v-if="loading" class="d-flex justify-center py-12">
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
    </div>

    <!-- Empty State -->
    <v-card v-else-if="filteredMaterials.length === 0" class="text-center pa-8 rounded-lg" variant="tonal" color="grey-lighten-2">
      <v-card-text>
        <v-icon size="x-large" color="grey">mdi-file-search-outline</v-icon>
        <div class="text-h6 mt-4">Keine Materialien gefunden</div>
        <div class="text-body-1 mt-2 text-medium-emphasis">
          {{ isFiltered ? 'Versuchen Sie andere Suchkriterien oder Filter.' : 'Erstellen Sie Ihr erstes Material, um loszulegen.' }}
        </div>
      </v-card-text>
      <v-card-actions class="justify-center">
        <v-btn
          v-if="isFiltered"
          variant="text"
          @click="resetFilters"
          class="mr-2"
        >
          Filter zurücksetzen
        </v-btn>
        <v-btn
          color="primary"
          to="/create"
          prepend-icon="mdi-plus"
        >
          Neues Material erstellen
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- Grid View -->
    <template v-else-if="viewMode === 'grid'">
      <v-container fluid class="pa-0">
        <v-virtual-scroll
          v-if="filteredMaterials.length > 50"
          :items="filteredMaterials"
          :item-height="330"
          height="800px"
        >
          <template v-slot:default="{ item: material }">
            <v-card class="ma-2 h-100 d-flex flex-column rounded-lg" hover elevation="2">
              <v-card-item class="pb-0">
                <template v-slot:prepend>
                  <v-icon :color="getColorForType(material.type)" size="large">
                    {{ getIconForType(material.type) }}
                  </v-icon>
                </template>
                <v-card-title class="text-subtitle-1 font-weight-bold">
                  {{ truncateText(material.title, 50) }}
                </v-card-title>
                <template v-slot:append>
                  <v-checkbox
                    v-model="selected"
                    :value="material.id"
                    hide-details
                    density="compact"
                    class="mr-2"
                  ></v-checkbox>
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        v-bind="props"
                        @click.stop
                      >
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item prepend-icon="mdi-pencil-outline" title="Bearbeiten" :to="`/edit/${material.id}`"></v-list-item>
                      <v-list-item prepend-icon="mdi-content-copy" title="Duplizieren" @click="duplicateMaterialAction(material)"></v-list-item>
                      <v-list-item prepend-icon="mdi-export-variant" title="Exportieren" @click="openExportDialogAction(material)"></v-list-item>
                      <v-list-item prepend-icon="mdi-file-pdf-box" title="Als PDF" @click="exportToPDF(material)"></v-list-item>
                      <v-list-item prepend-icon="mdi-share-variant-outline" title="Teilen"></v-list-item>
                      <v-divider></v-divider>
                      <v-list-item :base-color="material.favorite ? 'warning' : 'default'" @click="toggleFavoriteAction(material.id)">
                        <template #prepend>
                          <v-icon>{{ material.favorite ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
                        </template>
                        <v-list-item-title>{{ material.favorite ? 'Favorit entfernen' : 'Als Favorit' }}</v-list-item-title>
                      </v-list-item>
                      <v-divider></v-divider>
                      <v-list-item prepend-icon="mdi-delete-outline" title="Löschen" base-color="error" @click="confirmDeleteAction(material)"></v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-card-item>

              <v-card-text class="flex-grow-1 pt-2">
                <v-chip size="small" color="secondary" label variant="tonal" class="mr-1 mb-1">
                  {{ material.subject }}
                </v-chip>
                
                <!-- Language level chip if available -->
                <v-chip v-if="material.language?.level" size="small" color="info" label variant="tonal" class="mr-1 mb-1">
                  {{ material.language.level }}
                </v-chip>
                
                <!-- Tags if available -->
                <div v-if="material.tags?.length" class="mt-2">
                  <v-chip
                    v-for="tag in material.tags.slice(0, 3)"
                    :key="tag"
                    size="x-small"
                    class="mr-1 mb-1"
                    variant="outlined"
                  >
                    {{ tag }}
                  </v-chip>
                  <v-chip v-if="material.tags.length > 3" size="x-small" variant="outlined" class="mb-1">
                    +{{ material.tags.length - 3 }}
                  </v-chip>
                </div>
                
                <div class="text-caption text-medium-emphasis mt-2">
                  Erstellt: {{ formatDate(material.created) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Geändert: {{ formatDate(material.modified) }}
                </div>
                
                <!-- Usage stats if available -->
                <div v-if="material.usageCount !== undefined" class="mt-2">
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-caption">Nutzung</span>
                    <span class="text-caption">{{ material.usageCount }}×</span>
                  </div>
                  <v-progress-linear
                    :model-value="Math.min((material.usageCount) * 10, 100)"
                    color="primary"
                    height="4"
                    rounded
                  ></v-progress-linear>
                </div>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn
                  variant="text"
                  color="primary"
                  block
                  :to="`/edit/${material.id}`"
                >
                  <v-icon start>mdi-pencil-outline</v-icon>
                  Bearbeiten
                </v-btn>
              </v-card-actions>
            </v-card>
          </template>
        </v-virtual-scroll>
        
        <v-row v-else>
          <v-col
            v-for="material in paginatedMaterials"
            :key="material.id"
            cols="12"
            sm="6"
            md="4"
            lg="3"
          >
            <v-card class="h-100 d-flex flex-column rounded-lg" hover elevation="2">
              <v-card-item class="pb-0">
                <template v-slot:prepend>
                  <v-icon :color="getColorForType(material.type)" size="large">
                    {{ getIconForType(material.type) }}
                  </v-icon>
                </template>
                <v-card-title class="text-subtitle-1 font-weight-bold">
                  {{ truncateText(material.title, 50) }}
                </v-card-title>
                <template v-slot:append>
                  <v-checkbox
                    v-model="selected"
                    :value="material.id"
                    hide-details
                    density="compact"
                    class="mr-2"
                  ></v-checkbox>
                  <v-menu>
                    <template v-slot:activator="{ props }">
                      <v-btn
                        icon
                        variant="text"
                        size="small"
                        v-bind="props"
                        @click.stop
                      >
                        <v-icon>mdi-dots-vertical</v-icon>
                      </v-btn>
                    </template>
                    <v-list density="compact">
                      <v-list-item prepend-icon="mdi-pencil-outline" title="Bearbeiten" :to="`/edit/${material.id}`"></v-list-item>
                      <v-list-item prepend-icon="mdi-content-copy" title="Duplizieren" @click="duplicateMaterialAction(material)"></v-list-item>
                      <v-list-item prepend-icon="mdi-export-variant" title="Exportieren" @click="openExportDialogAction(material)"></v-list-item>
                      <v-list-item prepend-icon="mdi-file-pdf-box" title="Als PDF" @click="exportToPDF(material)"></v-list-item>
                      <v-list-item prepend-icon="mdi-share-variant-outline" title="Teilen"></v-list-item>
                      <v-divider></v-divider>
                      <v-list-item :base-color="material.favorite ? 'warning' : 'default'" @click="toggleFavoriteAction(material.id)">
                        <template #prepend>
                          <v-icon>{{ material.favorite ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
                        </template>
                        <v-list-item-title>{{ material.favorite ? 'Favorit entfernen' : 'Als Favorit' }}</v-list-item-title>
                      </v-list-item>
                      <v-divider></v-divider>
                      <v-list-item prepend-icon="mdi-delete-outline" title="Löschen" base-color="error" @click="confirmDeleteAction(material)"></v-list-item>
                    </v-list>
                  </v-menu>
                </template>
              </v-card-item>

              <v-card-text class="flex-grow-1 pt-2">
                <v-chip size="small" color="secondary" label variant="tonal" class="mr-1 mb-1">
                  {{ material.subject }}
                </v-chip>
                
                <!-- Language level chip if available -->
                <v-chip v-if="material.language?.level" size="small" color="info" label variant="tonal" class="mr-1 mb-1">
                  {{ material.language.level }}
                </v-chip>
                
                <!-- Tags if available -->
                <div v-if="material.tags?.length" class="mt-2">
                  <v-chip
                    v-for="tag in material.tags.slice(0, 3)"
                    :key="tag"
                    size="x-small"
                    class="mr-1 mb-1"
                    variant="outlined"
                  >
                    {{ tag }}
                  </v-chip>
                  <v-chip v-if="material.tags.length > 3" size="x-small" variant="outlined" class="mb-1">
                    +{{ material.tags.length - 3 }}
                  </v-chip>
                </div>
                
                <div class="text-caption text-medium-emphasis mt-2">
                  Erstellt: {{ formatDate(material.created) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  Geändert: {{ formatDate(material.modified) }}
                </div>
                
                <!-- Usage stats if available -->
                <div v-if="material.usageCount !== undefined" class="mt-2">
                  <div class="d-flex align-center justify-space-between">
                    <span class="text-caption">Nutzung</span>
                    <span class="text-caption">{{ material.usageCount }}×</span>
                  </div>
                  <v-progress-linear
                    :model-value="Math.min((material.usageCount) * 10, 100)"
                    color="primary"
                    height="4"
                    rounded
                  ></v-progress-linear>
                </div>
              </v-card-text>

              <v-divider></v-divider>

              <v-card-actions>
                <v-btn
                  variant="text"
                  color="primary"
                  block
                  :to="`/edit/${material.id}`"
                >
                  <v-icon start>mdi-pencil-outline</v-icon>
                  Bearbeiten
                </v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-container>

      <div class="text-center mt-4" v-if="pageCount > 1">
        <v-pagination
          v-model="page"
          :length="pageCount"
          rounded="circle"
          density="compact"
        ></v-pagination>
      </div>
    </template>

    <!-- List View -->
    <template v-else>
      <v-data-table-server
        v-model:items-per-page="listItemsPerPage"
        :headers="headers"
        :items="filteredMaterials" 
        :items-length="filteredMaterials.length" 
        :loading="loading"
        :search="search"
        v-model:selected="selected"
        show-select
        class="elevation-1"
        @update:options="loadItems"
        items-per-page-text="Elemente pro Seite"
      >
         <template v-slot:item.type="{ item }">
          <div class="d-flex align-center">
            <v-icon :color="getColorForType(item.type)" class="mr-2">
              {{ getIconForType(item.type) }}
            </v-icon>
            {{ getTypeName(item.type) }}
          </div>
        </template>

        <template v-slot:item.title="{ item }">
          <router-link :to="`/edit/${item.id}`" class="text-decoration-none text-high-emphasis font-weight-medium">
             {{ item.title }}
          </router-link>
          <div v-if="item.tags?.length" class="mt-1">
            <v-chip
              v-for="tag in item.tags.slice(0, 2)"
              :key="tag"
              size="x-small"
              class="mr-1"
              variant="outlined"
              density="compact"
            >
              {{ tag }}
            </v-chip>
            <v-chip v-if="item.tags.length > 2" size="x-small" variant="outlined" density="compact">
              +{{ item.tags.length - 2 }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.subject="{ item }">
          <v-chip size="small" color="secondary" variant="tonal" label>
            {{ item.subject }}
          </v-chip>
          <div v-if="item.language?.level" class="mt-1">
            <v-chip size="x-small" color="info" variant="tonal" label>
              {{ item.language.level }}
            </v-chip>
          </div>
        </template>

        <template v-slot:item.created="{ item }">
          {{ formatDate(item.created) }}
        </template>

        <template v-slot:item.modified="{ item }">
          {{ formatDate(item.modified) }}
        </template>

         <template v-slot:item.favorite="{ item }">
             <v-btn
                icon
                variant="text"
                :color="item.favorite ? 'warning' : 'grey'"
                size="small"
                @click.stop="toggleFavoriteAction(item.id)"
             >
               <v-icon>{{ item.favorite ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
             </v-btn>
         </template>

        <template v-slot:item.actions="{ item }">
            <v-btn
                icon="mdi-pencil-outline"
                variant="text"
                color="primary"
                size="small"
                :to="`/edit/${item.id}`"
            ></v-btn>
           <v-menu>
               <template v-slot:activator="{ props }">
                   <v-btn
                      icon="mdi-dots-vertical"
                      variant="text"
                      size="small"
                      v-bind="props"
                      @click.stop
                   ></v-btn>
               </template>
               <v-list density="compact">
                 <v-list-item prepend-icon="mdi-content-copy" title="Duplizieren" @click="duplicateMaterialAction(item)"></v-list-item>
                 <v-list-item prepend-icon="mdi-export-variant" title="Exportieren" @click="openExportDialogAction(item)"></v-list-item>
                 <v-list-item prepend-icon="mdi-file-pdf-box" title="Als PDF" @click="exportToPDF(item)"></v-list-item>
                 <v-list-item prepend-icon="mdi-share-variant-outline" title="Teilen"></v-list-item>
                 <v-divider></v-divider>
                 <v-list-item prepend-icon="mdi-delete-outline" title="Löschen" base-color="error" @click="confirmDeleteAction(item)"></v-list-item>
              </v-list>
           </v-menu>
        </template>

        <template v-slot:loading>
           <v-skeleton-loader type="table-row@10"></v-skeleton-loader>
        </template>

        <template v-slot:no-data>
            Keine Materialien für Ihre Filterkriterien gefunden.
        </template>
      </v-data-table-server>
    </template>

    <!-- Delete Confirmation Dialog -->
    <v-dialog v-model="deleteDialog" max-width="450">
       <v-card class="rounded-lg">
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon color="error" start>mdi-alert-circle-outline</v-icon>
          Material löschen
        </v-card-title>
        <v-card-text>
          Sind Sie sicher, dass Sie das Material
          <strong class="mx-1">"{{ selectedMaterial?.title }}"</strong>
          endgültig löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="deleteDialog = false">Abbrechen</v-btn>
          <v-btn color="error" variant="flat" @click="deleteMaterialAction" :loading="deleting">
            Löschen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Batch Delete Confirmation Dialog -->
    <v-dialog v-model="batchDeleteDialog" max-width="450">
       <v-card class="rounded-lg">
        <v-card-title class="text-h6 d-flex align-center">
          <v-icon color="error" start>mdi-alert-circle-outline</v-icon>
          Materialien löschen
        </v-card-title>
        <v-card-text>
          Sind Sie sicher, dass Sie die ausgewählten {{ selected.length }} Materialien
          endgültig löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="batchDeleteDialog = false">Abbrechen</v-btn>
          <v-btn color="error" variant="flat" @click="deleteBatchMaterials" :loading="deleting">
            Alle löschen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    
    <!-- Tag Dialog -->
    <v-dialog v-model="tagDialog" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6">Tags zuweisen</v-card-title>
        <v-card-text>
          <v-combobox
            v-model="selectedTags"
            :items="availableTags"
            label="Tags hinzufügen oder bestehende auswählen"
            multiple
            chips
            closable-chips
            variant="outlined"
          ></v-combobox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="tagDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="applyTags" :loading="tagging">
            Tags zuweisen
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Export Dialog -->
    <export-dialog
        v-model="exportDialog"
        :material-id="selectedMaterial?.id?.toString()"
    />
    
    <!-- Batch Export Dialog -->
    <v-dialog v-model="batchExportDialog" max-width="500">
      <v-card class="rounded-lg">
        <v-card-title class="text-h6">
          <v-icon start>mdi-export-variant</v-icon>
          Mehrere Materialien exportieren
        </v-card-title>
        <v-card-text>
          <p class="mb-4">Wählen Sie ein Format für den Export der {{ selected.length }} ausgewählten Materialien:</p>
          
          <v-radio-group v-model="batchExportFormat" density="compact">
            <v-radio value="pdf" label="PDF-Dokumente"></v-radio>
            <v-radio value="docx" label="Word-Dokumente"></v-radio>
            <v-radio value="zip" label="Als ZIP-Archiv"></v-radio>
          </v-radio-group>
          
          <v-checkbox 
            v-model="batchExportSingleFile" 
            label="Als ein einziges Dokument exportieren"
            density="compact"
            class="mt-2"
          ></v-checkbox>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="batchExportDialog = false">Abbrechen</v-btn>
          <v-btn color="primary" @click="processBatchExport" :loading="exporting">
            Exportieren
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar for feedback -->
    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      location="top right"
    >
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn
          variant="text"
          @click="snackbar.show = false"
        >
          Schließen
        </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, reactive, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useMaterialsStore } from '@/stores/materials';
import ExportDialog from '@/components/ExportDialog.vue';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

const router = useRouter();
const materialsStore = useMaterialsStore();

// UI state
const loading = ref(false);
const viewMode = ref('grid'); // 'grid' or 'list'
const page = ref(1); // For grid pagination
const gridItemsPerPage = ref(12);
const listItemsPerPage = ref(10); // For data table
const search = ref('');
const typeFilter = ref(null);
const subjectFilter = ref(null);
const favoritesOnly = ref(false);
const sortBy = ref([{ key: 'modified', order: 'desc' }]); // Default sort for data table
const showAdvancedFilters = ref(false);

// Advanced filters
const tagFilters = ref([]);
const languageLevelFilter = ref(null);
const dateFilter = ref(null);
const availableTags = computed(() => {
 const tags = new Set();
 materialsStore.materials.forEach(m => {
   if (m.tags?.length) {
     m.tags.forEach(tag => tags.add(tag));
   }
 });
 return Array.from(tags).sort();
});

// Batch operations
const selected = ref([]);
const selectedTags = ref([]);
const batchExportFormat = ref('pdf');
const batchExportSingleFile = ref(false);
const tagging = ref(false);
const exporting = ref(false);

// Dialog state
const deleteDialog = ref(false);
const batchDeleteDialog = ref(false);
const exportDialog = ref(false);
const batchExportDialog = ref(false);
const tagDialog = ref(false);
const selectedMaterial = ref(null);
const deleting = ref(false);

// Snackbar state
const snackbar = reactive({
   show: false,
   message: '',
   color: 'success',
   timeout: 3000
});

// Data table headers
const headers = [
 { title: '', key: 'select', sortable: false, width: '5%' },
 { title: 'Typ', key: 'type', sortable: true, width: '10%' },
 { title: 'Titel', key: 'title', sortable: true, width: '35%' },
 { title: 'Fach', key: 'subject', sortable: true, width: '15%' },
 { title: 'Bearbeitet', key: 'modified', sortable: true, width: '12%' },
 { title: 'Favorit', key: 'favorite', sortable: true, align: 'center', width: '8%'},
 { title: 'Aktionen', key: 'actions', sortable: false, align: 'end', width: '10%' },
];

// Filter/Sort options
const typeOptions = [
  { title: 'Alle Typen', value: null },
  { title: 'Arbeitsblatt', value: 'Arbeitsblatt' },
  { title: 'Quiz', value: 'Quiz' },
  { title: 'glossary', value: 'glossary' },
  { title: 'presentation', value: 'presentation' },
  { title: 'graphic', value: 'graphic' },
  { title: 'video', value: 'video' },
];

const languageLevels = [
 { title: 'A1 (Anfänger)', value: 'A1' },
 { title: 'A2 (Grundlagen)', value: 'A2' },
 { title: 'B1 (Mittelstufe)', value: 'B1' },
 { title: 'B2 (Fortgeschritten)', value: 'B2' },
 { title: 'C1 (Experte)', value: 'C1' },
 { title: 'C2 (Muttersprachlich)', value: 'C2' },
];

const dateFilters = [
 { title: 'Heute', value: 'today' },
 { title: 'Diese Woche', value: 'week' },
 { title: 'Diesen Monat', value: 'month' },
 { title: 'Dieses Jahr', value: 'year' },
];

const subjectOptions = computed(() => {
 const subjects = new Set(materialsStore.materials.map(m => m.subject).filter(Boolean));
 return [{ title: 'Alle Fächer', value: null }, ...Array.from(subjects).sort().map(s => ({ title: s, value: s }))];
});

const sortOptions = [
 { title: 'Neueste zuerst', value: [{ key: 'modified', order: 'desc' }] },
 { title: 'Älteste zuerst', value: [{ key: 'modified', order: 'asc' }] },
 { title: 'Titel A-Z', value: [{ key: 'title', order: 'asc' }] },
 { title: 'Titel Z-A', value: [{ key: 'title', order: 'desc' }] },
];

// Show snackbar feedback
const showSnackbar = (message, color = 'success') => {
   snackbar.message = message;
   snackbar.color = color;
   snackbar.show = true;
};

// Load materials on mount
onMounted(async () => {
 loading.value = true;
 try {
   // Fetch only if store is empty, assuming it persists or is loaded elsewhere initially
   if(materialsStore.materials.length === 0) {
       await materialsStore.fetchMaterials();
   }
 } catch (error) {
   console.error('Error loading materials:', error);
   showSnackbar('Fehler beim Laden der Materialien.', 'error');
 } finally {
   loading.value = false;
 }
});

// Aktualisiere den Store, wenn wir die Ansicht verlassen
onBeforeUnmount(async () => {
 try {
   await materialsStore.fetchMaterials();
 } catch (error) {
   console.error('Error refreshing materials before unmount:', error);
 }
});

// Filtered materials logic
const filteredMaterials = computed(() => {
 let result = [...materialsStore.materials];

 // Apply search
 if (search.value) {
   const searchLower = search.value.toLowerCase();
   result = result.filter(m =>
     m.title.toLowerCase().includes(searchLower) ||
     m.subject?.toLowerCase().includes(searchLower) ||
     m.tags?.some(tag => tag.toLowerCase().includes(searchLower))
   );
 }
 
 // Apply type filter
 if (typeFilter.value) {
   result = result.filter(m => m.type === typeFilter.value);
 }
 
 // Apply subject filter
 if (subjectFilter.value) {
   result = result.filter(m => m.subject === subjectFilter.value);
 }
 
 // Apply favorites filter
 if (favoritesOnly.value) {
   result = result.filter(m => m.favorite);
 }
 
 // Apply tag filters
 if (tagFilters.value.length > 0) {
   result = result.filter(m => 
     m.tags && tagFilters.value.every(tag => m.tags.includes(tag))
   );
 }
 
 // Apply language level filter
 if (languageLevelFilter.value) {
   result = result.filter(m => 
     m.language?.level === languageLevelFilter.value
   );
 }
 
 // Apply date filter
 if (dateFilter.value) {
   const now = new Date();
   const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
   const startOfWeek = new Date(today);
   startOfWeek.setDate(today.getDate() - today.getDay());
   const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
   const startOfYear = new Date(now.getFullYear(), 0, 1);
   
   let dateLimit;
   switch (dateFilter.value) {
     case 'today':
       dateLimit = today;
       break;
     case 'week':
       dateLimit = startOfWeek;
       break;
     case 'month':
       dateLimit = startOfMonth;
       break;
     case 'year':
       dateLimit = startOfYear;
       break;
   }
   
   result = result.filter(m => {
     const modifiedDate = new Date(m.modified);
     return modifiedDate >= dateLimit;
   });
 }

 // Sorting is handled by v-data-table-server or manually for grid
 if (viewMode.value === 'grid' && sortBy.value.length > 0) {
      const sortKey = sortBy.value[0].key;
      const sortOrder = sortBy.value[0].order;
      result.sort((a, b) => {
          let valA = a[sortKey];
          let valB = b[sortKey];
          if (sortKey === 'modified' || sortKey === 'created') {
              valA = new Date(valA);
              valB = new Date(valB);
          }
          if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
          if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
          return 0;
      });
  }

 return result;
});

// Grid Pagination
const paginatedMaterials = computed(() => {
 const start = (page.value - 1) * gridItemsPerPage.value;
 const end = start + gridItemsPerPage.value;
 return filteredMaterials.value.slice(start, end);
});
const pageCount = computed(() => {
 return Math.ceil(filteredMaterials.value.length / gridItemsPerPage.value);
});

// Data Table Server loading (placeholder for actual server-side)
const loadItems = ({ page, itemsPerPage, sortBy }) => {
 console.log('Load items (server-side placeholder):', { page, itemsPerPage, sortBy });
 // In a real server-side scenario, you'd fetch data here based on options
};

// Reset filters
const resetFilters = () => {
   search.value = '';
   typeFilter.value = null;
   subjectFilter.value = null;
   favoritesOnly.value = false;
   tagFilters.value = [];
   languageLevelFilter.value = null;
   dateFilter.value = null;
};

// Check if filters are active
const isFiltered = computed(() => {
 return !!search.value || 
        !!typeFilter.value || 
        !!subjectFilter.value || 
        favoritesOnly.value || 
        tagFilters.value.length > 0 || 
        !!languageLevelFilter.value || 
        !!dateFilter.value;
});

// --- Helper Functions ---
const getTypeName = (type) => type || '';

const getIconForType = (type) => {
  const map = {
    'worksheet': 'mdi-file-document-outline',
    'quiz': 'mdi-help-circle-outline',
    'glossary': 'mdi-book-open-variant',
    'presentation': 'mdi-presentation',
    'graphic': 'mdi-chart-bar',
    'video': 'mdi-video',
  };
  return map[type?.toLowerCase()] || 'mdi-file-outline';
};

const getColorForType = (type) => {
  const map = {
    'worksheet': 'success',
    'quiz': 'info',
    'glossary': 'warning',
    'presentation': 'purple',
    'graphic': 'red',
    'video': 'grey'
  };
  return map[type] || 'grey';
};

const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('de-DE') : '-';
const truncateText = (text, len) => (text && text.length > len) ? text.slice(0, len) + '…' : text;

// Hilfsfunktion zum Entfernen von HTML-Tags
const stripHtml = (html) => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// --- Batch Operations ---
const exportSelected = () => {
 if (selected.value.length === 0) return;
 batchExportDialog.value = true;
};

const processBatchExport = async () => {
 if (selected.value.length === 0) return;
 
 exporting.value = true;
 try {
   // Mock export operation
   await new Promise(resolve => setTimeout(resolve, 1500));
   
   showSnackbar(`${selected.value.length} Materialien wurden erfolgreich exportiert.`);
   selected.value = []; // Clear selection
   batchExportDialog.value = false;
 } catch (error) {
   console.error('Export error:', error);
   showSnackbar('Fehler beim Exportieren der Materialien.', 'error');
 } finally {
   exporting.value = false;
 }
};

const tagSelected = () => {
 if (selected.value.length === 0) return;
 
 // Prepare common tags if any
 const commonTags = [];
 const firstMaterial = materialsStore.getMaterialById(selected.value[0]);
 if (firstMaterial?.tags) {
   // Start with all tags from first material
   commonTags.push(...firstMaterial.tags);
   
   // Check if they exist in all other selected materials
   for (let i = 1; i < selected.value.length; i++) {
     const material = materialsStore.getMaterialById(selected.value[i]);
     if (!material?.tags) {
       commonTags.length = 0; // No tags in this material, so no common tags
       break;
     }
     
     // Keep only tags that exist in this material
     for (let j = commonTags.length - 1; j >= 0; j--) {
       if (!material.tags.includes(commonTags[j])) {
         commonTags.splice(j, 1);
       }
     }
     
     if (commonTags.length === 0) break; // No common tags found
   }
 }
 
 selectedTags.value = [...commonTags];
 tagDialog.value = true;
};

const applyTags = async () => {
 if (selected.value.length === 0 || selectedTags.value.length === 0) return;
 
 tagging.value = true;
 try {
   // Update all selected materials with the tags
   for (const id of selected.value) {
     const material = materialsStore.getMaterialById(id);
     if (material) {
       const currentTags = material.tags || [];
       const newTags = [...new Set([...currentTags, ...selectedTags.value])]; // Remove duplicates
       
       await materialsStore.updateMaterial({
         id,
         tags: newTags,
         modified: new Date().toISOString()
       });
     }
   }
   
   showSnackbar(`Tags wurden zu ${selected.value.length} Materialien hinzugefügt.`);
   tagDialog.value = false;
 } catch (error) {
   console.error('Error applying tags:', error);
   showSnackbar('Fehler beim Zuweisen der Tags.', 'error');
 } finally {
   tagging.value = false;
 }
};

const confirmDeleteSelected = () => {
 if (selected.value.length === 0) return;
 batchDeleteDialog.value = true;
};

const deleteBatchMaterials = async () => {
 if (selected.value.length === 0) return;
 
 deleting.value = true;
 try {
   const count = selected.value.length;
   
   // Delete each selected material
   for (const id of selected.value) {
     await materialsStore.deleteMaterial(id);
   }
   
   showSnackbar(`${count} Materialien wurden erfolgreich gelöscht.`);
   selected.value = []; // Clear selection
   batchDeleteDialog.value = false;
 } catch (error) {
   console.error('Error deleting materials:', error);
   showSnackbar('Fehler beim Löschen der Materialien.', 'error');
 } finally {
   deleting.value = false;
 }
};

// --- Individual Material Actions ---

// Favorite
const toggleFavoriteAction = async (id) => {
   try {
       await materialsStore.toggleFavorite(id);
       // Optional: Show feedback
   } catch (error) {
       showSnackbar('Fehler beim Ändern des Favoritenstatus.', 'error');
   }
};

// Duplicate
const duplicateMaterialAction = async (material) => {
 if (!material) return;
 try {
   const newMaterial = await materialsStore.addMaterial({
     ...material,
     id: undefined,
     title: `${material.title} (Kopie)`,
     created: new Date().toISOString(),
     modified: new Date().toISOString(),
   });
   showSnackbar(`'${material.title}' wurde dupliziert.`);
   router.push(`/edit/${newMaterial.id}`);
 } catch (error) {
   showSnackbar('Fehler beim Duplizieren.', 'error');
 }
};

// Export
const openExportDialogAction = (material) => {
 selectedMaterial.value = material;
 exportDialog.value = true;
};

// Delete
const confirmDeleteAction = (material) => {
 selectedMaterial.value = material;
 deleteDialog.value = true;
};

const deleteMaterialAction = async () => {
 if (!selectedMaterial.value) return;
 deleting.value = true;
 try {
   await materialsStore.deleteMaterial(selectedMaterial.value.id);
   showSnackbar(`'${selectedMaterial.value.title}' wurde gelöscht.`);
   deleteDialog.value = false;
   selectedMaterial.value = null;
 } catch (error) {
   showSnackbar('Fehler beim Löschen.', 'error');
 } finally {
   deleting.value = false;
 }
};

// Reset page on filter/search changes
watch([search, typeFilter, subjectFilter, favoritesOnly, tagFilters, languageLevelFilter, dateFilter], () => { 
 page.value = 1; 
});

const exportToPDF = async (material) => {
  // Erstelle temporäres div für die Vorschau
  const previewDiv = document.createElement('div');
  previewDiv.style.position = 'absolute';
  previewDiv.style.left = '-9999px';
  previewDiv.style.top = '-9999px';
  previewDiv.style.width = '595px'; // A4 Breite in Pixeln bei 72 DPI
  previewDiv.style.padding = '40px';
  previewDiv.style.backgroundColor = 'white';
  
  // Bestimme den Inhalt - verwende verschiedene mögliche Felder
  const content = material.content || material.preview || material.aiResponse || '';
  const hasContent = content && content.trim() !== '';
  
  previewDiv.innerHTML = `
    <div style="font-family: Arial, sans-serif; font-size: 12px;">
      <h1 style="font-size: 18px; margin-bottom: 15px; color: #333;">${material.title || 'Unbenanntes Material'}</h1>
      
      <div style="margin-bottom: 15px; color: #666;">
        <p style="margin: 5px 0;"><strong>Typ:</strong> ${getTypeName(material.type)}</p>
        <p style="margin: 5px 0;"><strong>Fach:</strong> ${material.subject || 'Nicht angegeben'}</p>
        ${material.language?.level ? `<p style="margin: 5px 0;"><strong>Sprachniveau:</strong> ${material.language.level}</p>` : ''}
      </div>
      
      ${material.tags?.length ? `
        <div style="margin-bottom: 15px;">
          <p style="margin: 5px 0; color: #666;"><strong>Tags:</strong></p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${material.tags.map(tag => `
              <span style="background: #f5f5f5; padding: 2px 6px; border-radius: 3px; font-size: 11px;">${tag}</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${hasContent ? `
        <div style="margin-top: 20px;">
          <h2 style="font-size: 14px; margin-bottom: 10px; color: #333;">Inhalt</h2>
          <div style="line-height: 1.5; color: #333;">${content}</div>
        </div>
      ` : `
        <div style="margin-top: 20px; color: #999; text-align: center; padding: 20px;">
          <p>Kein Inhalt verfügbar</p>
          <p style="font-size: 10px;">Material-ID: ${material.id}</p>
        </div>
      `}
    </div>
  `;
  
  document.body.appendChild(previewDiv);
  
  try {
    // Konvertiere das div zu einem Canvas
    const canvas = await html2canvas(previewDiv, {
      scale: 2, // Höhere Qualität
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      width: 595, // A4 Breite
      height: 842 // A4 Höhe
    });
    
    // Erstelle PDF
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    });
    
    // Berechne das Seitenverhältnis
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // Füge das Bild hinzu
    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    
    // PDF im neuen Tab öffnen
    const pdfData = pdf.output('datauristring');
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${material.title || 'Material'} - PDF Ansicht</title>
          <style>
            body, html {
              margin: 0;
              padding: 0;
              height: 100%;
              overflow: hidden;
            }
            iframe {
              width: 100%;
              height: 100%;
              border: none;
            }
          </style>
        </head>
        <body>
          <iframe src="${pdfData}"></iframe>
        </body>
      </html>
    `);
    printWindow.document.close();
  } finally {
    // Entferne das temporäre div
    document.body.removeChild(previewDiv);
  }
};
</script>

<style scoped>
.v-card-item .v-card-title {
   white-space: normal; /* Allow title to wrap */
   line-height: 1.3;
}
.v-data-table-server {
   --v-table-header-height: 48px;
}
</style>