/* =========================================================
   MASTER PRODUCTS - LÊ LANCHES
========================================================= */


/* =========================================================
   SUPABASE
========================================================= */

let supabaseClient = null;

if (
  window.supabase &&
  window.APP_CONFIG &&
  window.APP_CONFIG.supabaseUrl &&
  window.APP_CONFIG.supabaseAnonKey
) {

  supabaseClient =
    window.supabase.createClient(
      window.APP_CONFIG.supabaseUrl,
      window.APP_CONFIG.supabaseAnonKey
    );

}


/* =========================================================
   ESTADO
========================================================= */

let masterUser = null;
let masterProfile = null;

let products = [];
let ingredients = [];

let currentFilter = 'all';
let currentSearch = '';

let savingProduct = false;
let savingStock = false;
let savingRecipe = false;


/* =========================================================
   HELPERS
========================================================= */

function byId(id) {

  return document.getElementById(id);
}


function safeNumber(value) {

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
}


function roundCost(value) {

  return Math.round(
    (
      safeNumber(value) +
      Number.EPSILON
    ) *
    10000
  ) / 10000;
}


function escapeHtml(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


function normalizeText(value) {

  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}


function formatMoney(value) {

  return safeNumber(value)
    .toLocaleString(
      'pt-BR',
      {
        style: 'currency',
        currency: 'BRL'
      }
    );
}


function formatQuantity(value) {

  return safeNumber(value)
    .toLocaleString(
      'pt-BR',
      {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3
      }
    );
}


function formatUnit(unit) {

  const map = {

    un: 'un',
    kg: 'kg',
    g: 'g',
    l: 'L',
    ml: 'ml'

  };

  return map[unit] ||
    unit ||
    'un';
}


function generateProductCode(name) {

  const base =
    String(name || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 35);

  const suffix =
    Date.now()
      .toString()
      .slice(-6);

  return `${base || 'ITEM'}_${suffix}`;
}


function showMessage(
  element,
  text,
  type = ''
) {

  if (!element) {

    return;
  }

  element.textContent =
    text || '';

  element.className =
    'form-message';

  if (type) {

    element.classList.add(type);
  }
}


/* =========================================================
   AUTH
========================================================= */

async function validateMasterAccess() {

  if (!supabaseClient) {

    window.location.href =
      'master-login.html';

    return false;
  }

  const {
    data,
    error
  } =
    await supabaseClient.auth
      .getSession();

  if (
    error ||
    !data?.session?.user
  ) {

    window.location.href =
      'master-login.html';

    return false;
  }

  masterUser =
    data.session.user;

  const {
    data: profile,
    error: profileError
  } =
    await supabaseClient
      .from('profiles')
      .select(
        'id, full_name, role, active'
      )
      .eq(
        'id',
        masterUser.id
      )
      .single();

  if (
    profileError ||
    profile?.role !== 'master' ||
    profile?.active !== true
  ) {

    await supabaseClient.auth
      .signOut();

    window.location.href =
      'master-login.html';

    return false;
  }

  masterProfile =
    profile;

  if (
    byId('productsMasterName')
  ) {

    byId(
      'productsMasterName'
    ).textContent =
      profile.full_name ||
      'Master';
  }

  if (
    byId('productsMasterEmail')
  ) {

    byId(
      'productsMasterEmail'
    ).textContent =
      masterUser.email ||
      '';
  }

  return true;
}


/* =========================================================
   LOGOUT
========================================================= */

async function logoutMaster() {

  if (
    !confirm(
      'Deseja sair do Painel Master?'
    )
  ) {

    return;
  }

  await supabaseClient.auth
    .signOut();

  window.location.href =
    'master-login.html';
}


/* =========================================================
   MODALS
========================================================= */

function openModal(modal) {

  if (!modal) {

    return;
  }

  modal.classList.remove(
    'hidden'
  );

  modal.setAttribute(
    'aria-hidden',
    'false'
  );

  document.body.style.overflow =
    'hidden';
}


function closeModal(modal) {

  if (!modal) {

    return;
  }

  modal.classList.add(
    'hidden'
  );

  modal.setAttribute(
    'aria-hidden',
    'true'
  );

  if (
    !document.querySelector(
      '.modal:not(.hidden)'
    )
  ) {

    document.body.style.overflow =
      '';
  }
}


function closeModalByName(name) {

  const ids = {

    product:
      'productModal',

    stock:
      'stockModal',

    recipe:
      'recipeModal'

  };

  closeModal(
    byId(
      ids[name]
    )
  );
}


/* =========================================================
   CARREGAR PRODUTOS
========================================================= */

async function loadProducts() {

  const {
    data,
    error
  } =
    await supabaseClient
      .from('products')
      .select(
        `
        id,
        product_code,
        name,
        category,
        sale_price,
        average_cost,
        stock_quantity,
        minimum_stock,
        stock_control,
        available,
        active,
        item_type,
        unit,
        supplier,
        notes,
        created_at,
        updated_at
        `
      )
      .order(
        'name',
        {
          ascending: true
        }
      );

  if (error) {

    throw error;
  }

  products =
    Array.isArray(data)
      ? data
      : [];

  ingredients =
    products.filter(
      item =>
        item.item_type ===
        'ingredient' &&
        item.active === true
    );

  renderSummary();

  renderProducts();
}


/* =========================================================
   RESUMO
========================================================= */

function renderSummary() {

  const active =
    products.filter(
      item =>
        item.active === true
    );

  const productCount =
    active.filter(
      item =>
        item.item_type ===
        'product'
    ).length;

  const ingredientCount =
    active.filter(
      item =>
        item.item_type ===
        'ingredient'
    ).length;

  /*
   * Minimum = 0 significa "não definido".
   */

  const lowStockCount =
    active.filter(
      item => {

        if (
          item.stock_control !== true
        ) {

          return false;
        }

        const minimum =
          safeNumber(
            item.minimum_stock
          );

        if (
          minimum <= 0
        ) {

          return false;
        }

        return (
          safeNumber(
            item.stock_quantity
          ) <=
          minimum
        );
      }
    ).length;

  const stockValue =
    active.reduce(
      (
        total,
        item
      ) => {

        if (
          item.stock_control !== true
        ) {

          return total;
        }

        return (
          total +
          (
            safeNumber(
              item.stock_quantity
            ) *
            safeNumber(
              item.average_cost
            )
          )
        );
      },
      0
    );

  byId(
    'summaryProducts'
  ).textContent =
    productCount;

  byId(
    'summaryIngredients'
  ).textContent =
    ingredientCount;

  byId(
    'summaryLowStock'
  ).textContent =
    lowStockCount;

  byId(
    'summaryStockValue'
  ).textContent =
    formatMoney(
      stockValue
    );
}


/* =========================================================
   FILTROS
========================================================= */

function getFilteredProducts() {

  const search =
    normalizeText(
      currentSearch
    );

  return products
    .filter(
      item => {

        if (
          currentFilter !==
            'all' &&
          item.item_type !==
            currentFilter
        ) {

          return false;
        }

        if (!search) {

          return true;
        }

        const text =
          normalizeText(
            [
              item.name,
              item.product_code,
              item.category,
              item.supplier
            ].join(' ')
          );

        return text.includes(
          search
        );
      }
    );
}


/* =========================================================
   LISTA
========================================================= */

function renderProducts() {

  const container =
    byId(
      'productsList'
    );

  if (!container) {

    return;
  }

  const filtered =
    getFilteredProducts();

  if (
    filtered.length === 0
  ) {

    container.innerHTML =
      `
        <div class="empty-state">

          <span>
            🔎
          </span>

          <strong>
            Nenhum item encontrado
          </strong>

          <p>
            Altere a busca ou cadastre um novo item.
          </p>

        </div>
      `;

    return;
  }

  container.innerHTML =
    filtered
      .map(
        item => {

          const isIngredient =
            item.item_type ===
            'ingredient';

          const stock =
            safeNumber(
              item.stock_quantity
            );

          const minimum =
            safeNumber(
              item.minimum_stock
            );

          const cost =
            safeNumber(
              item.average_cost
            );

          const sale =
            safeNumber(
              item.sale_price
            );

          const margin =
            sale > 0
              ? (
                  (
                    sale -
                    cost
                  ) /
                  sale
                ) *
                100
              : 0;

          let stockClass = '';

          if (
            item.stock_control &&
            stock <= 0
          ) {

            stockClass =
              'danger';

          } else if (
            item.stock_control &&
            minimum > 0 &&
            stock <= minimum
          ) {

            stockClass =
              'warning';
          }

          return `

            <article class="product-row">

              <div class="product-main">

                <div class="product-icon">
                  ${
                    isIngredient
                      ? '🥩'
                      : '🍔'
                  }
                </div>

                <div class="product-info">

                  <strong>
                    ${escapeHtml(
                      item.name
                    )}
                  </strong>

                  <div class="product-meta">

                    <span
                      class="
                        type-badge
                        ${
                          isIngredient
                            ? 'ingredient'
                            : ''
                        }
                      "
                    >
                      ${
                        isIngredient
                          ? 'Insumo'
                          : 'Produto'
                      }
                    </span>

                    ${
                      item.category
                        ? `
                          <span class="product-category">
                            ${escapeHtml(
                              item.category
                            )}
                          </span>
                        `
                        : ''
                    }

                    <span class="product-code">
                      #${escapeHtml(
                        item.product_code
                      )}
                    </span>

                  </div>

                </div>

              </div>


              <div class="product-value">

                <span>
                  ${
                    isIngredient
                      ? 'Custo médio'
                      : 'Venda'
                  }
                </span>

                <strong>
                  ${
                    formatMoney(
                      isIngredient
                        ? cost
                        : sale
                    )
                  }
                </strong>

              </div>


              <div class="product-value">

                <span>
                  Estoque
                </span>

                <strong class="${stockClass}">
                  ${
                    item.stock_control
                      ?
                        (
                          formatQuantity(
                            stock
                          ) +
                          ' ' +
                          formatUnit(
                            item.unit
                          )
                        )
                      :
                        'Sem controle'
                  }
                </strong>

              </div>


              <div class="product-value hide-tablet">

                <span>
                  ${
                    isIngredient
                      ? 'Valor estoque'
                      : 'Custo'
                  }
                </span>

                <strong>
                  ${
                    isIngredient
                      ?
                        formatMoney(
                          stock *
                          cost
                        )
                      :
                        formatMoney(
                          cost
                        )
                  }
                </strong>

              </div>


              <div class="product-value hide-tablet">

                <span>
                  ${
                    isIngredient
                      ? 'Mínimo'
                      : 'Margem'
                  }
                </span>

                <strong
                  class="${
                    !isIngredient &&
                    margin > 0
                      ? 'positive'
                      : ''
                  }"
                >
                  ${
                    isIngredient
                      ?
                        (
                          minimum > 0
                            ?
                              (
                                formatQuantity(
                                  minimum
                                ) +
                                ' ' +
                                formatUnit(
                                  item.unit
                                )
                              )
                            :
                              'Não definido'
                        )
                      :
                        (
                          margin.toLocaleString(
                            'pt-BR',
                            {
                              minimumFractionDigits:
                                1,

                              maximumFractionDigits:
                                1
                            }
                          ) +
                          '%'
                        )
                  }
                </strong>

              </div>


              <div class="product-actions">

                <button
                  type="button"
                  class="action-btn"
                  data-edit="${item.id}"
                >
                  Editar
                </button>

                ${
                  item.stock_control
                    ? `
                      <button
                        type="button"
                        class="action-btn yellow"
                        data-stock="${item.id}"
                      >
                        + Entrada
                      </button>
                    `
                    : ''
                }

                ${
                  !isIngredient
                    ? `
                      <button
                        type="button"
                        class="action-btn green"
                        data-recipe="${item.id}"
                      >
                        Ficha técnica
                      </button>
                    `
                    : ''
                }

              </div>

            </article>

          `;
        }
      )
      .join('');
}


/* =========================================================
   LOCALIZAR ITEM
========================================================= */

function findProduct(id) {

  return products.find(
    item =>
      String(item.id) ===
      String(id)
  ) || null;
}


/* =========================================================
   TIPO DO FORMULÁRIO
========================================================= */

function selectedItemType() {

  return (
    document.querySelector(
      'input[name="itemType"]:checked'
    )?.value ===
      'ingredient'
      ? 'ingredient'
      : 'product'
  );
}


function updateFormByType() {

  const type =
    selectedItemType();

  const saleField =
    byId(
      'salePriceField'
    );

  if (
    type === 'ingredient'
  ) {

    saleField.style.display =
      'none';

    byId(
      'productSalePrice'
    ).value =
      '0';

  } else {

    saleField.style.display =
      '';
  }
}


/* =========================================================
   LIMPAR FORM
========================================================= */

function resetProductForm() {

  byId(
    'productForm'
  )?.reset();

  byId(
    'productId'
  ).value =
    '';

  byId(
    'productStock'
  ).value =
    '0';

  byId(
    'productMinimumStock'
  ).value =
    '';

  byId(
    'productAverageCost'
  ).value =
    '0';

  byId(
    'productSalePrice'
  ).value =
    '0';

  byId(
    'productUnit'
  ).value =
    'un';

  byId(
    'productStockControl'
  ).checked =
    true;

  byId(
    'productAvailable'
  ).checked =
    true;

  byId(
    'productActive'
  ).checked =
    true;

  const productRadio =
    document.querySelector(
      'input[name="itemType"][value="product"]'
    );

  if (productRadio) {

    productRadio.checked =
      true;
  }

  showMessage(
    byId(
      'productFormMessage'
    ),
    ''
  );

  updateFormByType();
}


/* =========================================================
   NOVO ITEM
========================================================= */

function openNewProduct() {

  resetProductForm();

  byId(
    'productModalTitle'
  ).textContent =
    'Novo item';

  byId(
    'btnSaveProduct'
  ).textContent =
    'Salvar item';

  openModal(
    byId(
      'productModal'
    )
  );

  setTimeout(
    () => {

      byId(
        'productName'
      )?.focus();

    },
    100
  );
}


/* =========================================================
   EDITAR
========================================================= */

function openEditProduct(id) {

  const item =
    findProduct(id);

  if (!item) {

    return;
  }

  resetProductForm();

  byId(
    'productId'
  ).value =
    item.id;

  const radio =
    document.querySelector(
      `input[name="itemType"][value="${
        item.item_type ===
          'ingredient'
          ? 'ingredient'
          : 'product'
      }"]`
    );

  if (radio) {

    radio.checked =
      true;
  }

  byId(
    'productName'
  ).value =
    item.name || '';

  byId(
    'productCode'
  ).value =
    item.product_code || '';

  byId(
    'productCategory'
  ).value =
    item.category || '';

  byId(
    'productUnit'
  ).value =
    item.unit || 'un';

  byId(
    'productSupplier'
  ).value =
    item.supplier || '';

  byId(
    'productSalePrice'
  ).value =
    safeNumber(
      item.sale_price
    );

  byId(
    'productAverageCost'
  ).value =
    safeNumber(
      item.average_cost
    );

  byId(
    'productStock'
  ).value =
    safeNumber(
      item.stock_quantity
    );

  byId(
    'productMinimumStock'
  ).value =
    safeNumber(
      item.minimum_stock
    ) > 0
      ?
        safeNumber(
          item.minimum_stock
        )
      :
        '';

  byId(
    'productStockControl'
  ).checked =
    item.stock_control === true;

  byId(
    'productAvailable'
  ).checked =
    item.available === true;

  byId(
    'productActive'
  ).checked =
    item.active === true;

  byId(
    'productNotes'
  ).value =
    item.notes || '';

  byId(
    'productModalTitle'
  ).textContent =
    `Editar ${item.name}`;

  byId(
    'btnSaveProduct'
  ).textContent =
    'Salvar alterações';

  updateFormByType();

  openModal(
    byId(
      'productModal'
    )
  );
}


/* =========================================================
   SALVAR PRODUTO
========================================================= */

async function saveProduct(event) {

  event.preventDefault();

  if (savingProduct) {

    return;
  }

  const message =
    byId(
      'productFormMessage'
    );

  showMessage(
    message,
    ''
  );

  const id =
    String(
      byId(
        'productId'
      ).value ||
      ''
    ).trim();

  const editing =
    Boolean(id);

  const type =
    selectedItemType();

  const name =
    byId(
      'productName'
    ).value.trim();

  if (!name) {

    showMessage(
      message,
      'Informe o nome do item.'
    );

    return;
  }

  let code =
    byId(
      'productCode'
    ).value
      .trim()
      .toUpperCase();

  if (!code) {

    code =
      generateProductCode(
        name
      );
  }

  const stock =
    safeNumber(
      byId(
        'productStock'
      ).value
    );

  const minimum =
    safeNumber(
      byId(
        'productMinimumStock'
      ).value
    );

  const averageCost =
    roundCost(
      byId(
        'productAverageCost'
      ).value
    );

  const salePrice =
    type === 'product'
      ?
        safeNumber(
          byId(
            'productSalePrice'
          ).value
        )
      :
        0;

  if (
    stock < 0 ||
    minimum < 0 ||
    averageCost < 0 ||
    salePrice < 0
  ) {

    showMessage(
      message,
      'Valores negativos não são permitidos.'
    );

    return;
  }

  const payload = {

    product_code:
      code,

    name:
      name,

    category:
      byId(
        'productCategory'
      ).value.trim() ||
      null,

    sale_price:
      salePrice,

    average_cost:
      averageCost,

    stock_quantity:
      stock,

    minimum_stock:
      minimum,

    stock_control:
      byId(
        'productStockControl'
      ).checked,

    available:
      byId(
        'productAvailable'
      ).checked,

    active:
      byId(
        'productActive'
      ).checked,

    item_type:
      type,

    unit:
      byId(
        'productUnit'
      ).value,

    supplier:
      byId(
        'productSupplier'
      ).value.trim() ||
      null,

    notes:
      byId(
        'productNotes'
      ).value.trim() ||
      null,

    updated_at:
      new Date()
        .toISOString()
  };

  const button =
    byId(
      'btnSaveProduct'
    );

  const oldButtonText =
    button.textContent;

  try {

    savingProduct =
      true;

    button.disabled =
      true;

    button.textContent =
      'Salvando...';

    showMessage(
      message,
      'Salvando item...',
      'warning'
    );

    let savedItem = null;

    if (editing) {

      const previous =
        findProduct(id);

      const {
        data,
        error
      } =
        await supabaseClient
          .from('products')
          .update(payload)
          .eq(
            'id',
            id
          )
          .select()
          .single();

      if (error) {

        throw error;
      }

      savedItem =
        data;

      /*
       * Alteração manual do estoque gera ajuste.
       */

      if (
        previous &&
        previous.stock_control === true &&
        payload.stock_control === true
      ) {

        const before =
          safeNumber(
            previous.stock_quantity
          );

        const after =
          stock;

        const difference =
          after -
          before;

        if (
          Math.abs(
            difference
          ) >
          0.0000001
        ) {

          const {
            error:
              movementError
          } =
            await supabaseClient
              .from(
                'stock_movements'
              )
              .insert(
                {

                  product_id:
                    savedItem.id,

                  movement_type:
                    difference > 0
                      ?
                        'ajuste_entrada'
                      :
                        'ajuste_saida',

                  quantity:
                    Math.abs(
                      difference
                    ),

                  unit_cost:
                    averageCost,

                  total_cost:
                    Math.abs(
                      difference
                    ) *
                    averageCost,

                  stock_before:
                    before,

                  stock_after:
                    after,

                  average_cost_before:
                    safeNumber(
                      previous.average_cost
                    ),

                  average_cost_after:
                    averageCost,

                  notes:
                    'Ajuste manual no cadastro.',

                  created_by:
                    masterUser.id
                }
              );

          if (movementError) {

            console.error(
              'Erro ao registrar ajuste:',
              movementError
            );
          }
        }
      }

    } else {

      const {
        data,
        error
      } =
        await supabaseClient
          .from('products')
          .insert(payload)
          .select()
          .single();

      if (error) {

        throw error;
      }

      savedItem =
        data;

      if (
        payload.stock_control &&
        stock > 0
      ) {

        const {
          error:
            movementError
        } =
          await supabaseClient
            .from(
              'stock_movements'
            )
            .insert(
              {

                product_id:
                  savedItem.id,

                movement_type:
                  'entrada',

                quantity:
                  stock,

                unit_cost:
                  averageCost,

                total_cost:
                  stock *
                  averageCost,

                stock_before:
                  0,

                stock_after:
                  stock,

                average_cost_before:
                  0,

                average_cost_after:
                  averageCost,

                notes:
                  'Estoque inicial.',

                created_by:
                  masterUser.id
              }
            );

        if (movementError) {

          console.error(
            'Erro no estoque inicial:',
            movementError
          );
        }
      }
    }

    showMessage(
      message,
      editing
        ?
          'Item atualizado com sucesso.'
        :
          'Item cadastrado com sucesso.',
      'success'
    );

    await loadProducts();

    setTimeout(
      () => {

        closeModal(
          byId(
            'productModal'
          )
        );

      },
      450
    );

  } catch (error) {

    console.error(
      'Erro ao salvar item:',
      error
    );

    let text =
      'Não foi possível salvar o item.';

    if (
      error?.code ===
      '23505'
    ) {

      text =
        'Já existe um item usando esse código.';
    }

    showMessage(
      message,
      text
    );

  } finally {

    savingProduct =
      false;

    button.disabled =
      false;

    button.textContent =
      oldButtonText;
  }
}


/* =========================================================
   ENTRADA DE ESTOQUE
========================================================= */

function openStockEntry(id) {

  const item =
    findProduct(id);

  if (!item) {

    return;
  }

  if (
    item.stock_control !==
    true
  ) {

    alert(
      'Este item não possui controle de estoque.'
    );

    return;
  }

  byId(
    'stockForm'
  ).reset();

  byId(
    'stockProductId'
  ).value =
    item.id;

  byId(
    'stockProductName'
  ).textContent =
    `${item.name} • ${formatUnit(
      item.unit
    )}`;

  byId(
    'stockCurrentQuantity'
  ).textContent =
    `${formatQuantity(
      item.stock_quantity
    )} ${formatUnit(
      item.unit
    )}`;

  byId(
    'stockCurrentCost'
  ).textContent =
    formatMoney(
      item.average_cost
    );

  showMessage(
    byId(
      'stockFormMessage'
    ),
    ''
  );

  calculateStockPreview();

  openModal(
    byId(
      'stockModal'
    )
  );

  setTimeout(
    () => {

      byId(
        'stockEntryQuantity'
      )?.focus();

    },
    100
  );
}


/* =========================================================
   PREVISÃO DA ENTRADA
========================================================= */

function calculateStockPreview() {

  const item =
    findProduct(
      byId(
        'stockProductId'
      ).value
    );

  if (!item) {

    return;
  }

  const currentStock =
    safeNumber(
      item.stock_quantity
    );

  const currentCost =
    safeNumber(
      item.average_cost
    );

  const quantity =
    safeNumber(
      byId(
        'stockEntryQuantity'
      ).value
    );

  const unitCost =
    safeNumber(
      byId(
        'stockEntryUnitCost'
      ).value
    );

  const newStock =
    currentStock +
    quantity;

  const purchaseTotal =
    quantity *
    unitCost;

  const previousValue =
    currentStock *
    currentCost;

  let newAverageCost =
    currentCost;

  if (
    quantity > 0 &&
    newStock > 0
  ) {

    newAverageCost =
      (
        previousValue +
        purchaseTotal
      ) /
      newStock;
  }

  newAverageCost =
    roundCost(
      newAverageCost
    );

  byId(
    'stockNewQuantity'
  ).textContent =
    `${formatQuantity(
      newStock
    )} ${formatUnit(
      item.unit
    )}`;

  byId(
    'stockNewAverageCost'
  ).textContent =
    formatMoney(
      newAverageCost
    );

  byId(
    'stockPurchaseTotal'
  ).textContent =
    formatMoney(
      purchaseTotal
    );
}


/* =========================================================
   SALVAR ENTRADA
========================================================= */

async function saveStockEntry(event) {

  event.preventDefault();

  if (savingStock) {

    return;
  }

  const message =
    byId(
      'stockFormMessage'
    );

  const id =
    String(
      byId(
        'stockProductId'
      ).value ||
      ''
    );

  const quantity =
    safeNumber(
      byId(
        'stockEntryQuantity'
      ).value
    );

  const unitCost =
    safeNumber(
      byId(
        'stockEntryUnitCost'
      ).value
    );

  if (
    quantity <= 0
  ) {

    showMessage(
      message,
      'Informe uma quantidade maior que zero.'
    );

    return;
  }

  if (
    unitCost < 0
  ) {

    showMessage(
      message,
      'O custo não pode ser negativo.'
    );

    return;
  }

  const button =
    byId(
      'btnSaveStockEntry'
    );

  try {

    savingStock =
      true;

    button.disabled =
      true;

    button.textContent =
      'Registrando...';

    showMessage(
      message,
      'Registrando entrada...',
      'warning'
    );

    /*
     * Busca estoque atual novamente para reduzir
     * risco de sobrescrever uma alteração anterior.
     */

    const {
      data: current,
      error
    } =
      await supabaseClient
        .from('products')
        .select(
          `
          id,
          name,
          stock_quantity,
          average_cost,
          stock_control,
          unit
          `
        )
        .eq(
          'id',
          id
        )
        .single();

    if (error) {

      throw error;
    }

    if (
      current.stock_control !==
      true
    ) {

      throw new Error(
        'O controle de estoque está desativado.'
      );
    }

    const beforeStock =
      safeNumber(
        current.stock_quantity
      );

    const beforeCost =
      safeNumber(
        current.average_cost
      );

    const afterStock =
      beforeStock +
      quantity;

    const purchaseTotal =
      quantity *
      unitCost;

    const previousValue =
      beforeStock *
      beforeCost;

    const afterCost =
      roundCost(
        (
          previousValue +
          purchaseTotal
        ) /
        afterStock
      );

    const {
      data: updated,
      error:
        updateError
    } =
      await supabaseClient
        .from('products')
        .update(
          {

            stock_quantity:
              afterStock,

            average_cost:
              afterCost,

            updated_at:
              new Date()
                .toISOString()

          }
        )
        .eq(
          'id',
          id
        )
        .eq(
          'stock_quantity',
          beforeStock
        )
        .select()
        .maybeSingle();

    if (updateError) {

      throw updateError;
    }

    if (!updated) {

      throw new Error(
        'O estoque mudou durante a operação. Tente novamente.'
      );
    }

    const {
      error:
        movementError
    } =
      await supabaseClient
        .from(
          'stock_movements'
        )
        .insert(
          {

            product_id:
              id,

            movement_type:
              'entrada',

            quantity:
              quantity,

            unit_cost:
              unitCost,

            total_cost:
              purchaseTotal,

            stock_before:
              beforeStock,

            stock_after:
              afterStock,

            average_cost_before:
              beforeCost,

            average_cost_after:
              afterCost,

            notes:
              byId(
                'stockEntryNotes'
              ).value.trim() ||
              'Entrada pelo Painel Master.',

            created_by:
              masterUser.id

          }
        );

    if (movementError) {

      console.error(
        movementError
      );

      throw new Error(
        'O estoque foi atualizado, mas houve erro no histórico.'
      );
    }

    /*
     * Se este item for um ingrediente,
     * recalcula os produtos que utilizam ele.
     */

    const localItem =
      findProduct(id);

    if (
      localItem?.item_type ===
      'ingredient'
    ) {

      await recalculateProductsUsingIngredient(
        id
      );
    }

    showMessage(
      message,
      `Entrada registrada. Novo custo médio: ${formatMoney(
        afterCost
      )}`,
      'success'
    );

    await loadProducts();

    setTimeout(
      () => {

        closeModal(
          byId(
            'stockModal'
          )
        );

      },
      600
    );

  } catch (error) {

    console.error(
      'Erro na entrada:',
      error
    );

    showMessage(
      message,
      error?.message ||
      'Não foi possível registrar a entrada.'
    );

  } finally {

    savingStock =
      false;

    button.disabled =
      false;

    button.textContent =
      'Registrar entrada';
  }
}


/* =========================================================
   FICHA TÉCNICA
========================================================= */

async function openRecipe(id) {

  const product =
    findProduct(id);

  if (
    !product ||
    product.item_type !==
      'product'
  ) {

    return;
  }

  byId(
    'recipeProductId'
  ).value =
    product.id;

  byId(
    'recipeProductName'
  ).textContent =
    product.name;

  showMessage(
    byId(
      'recipeFormMessage'
    ),
    ''
  );

  openModal(
    byId(
      'recipeModal'
    )
  );

  const container =
    byId(
      'recipeIngredientsList'
    );

  container.innerHTML =
    `
      <div class="empty-state small">
        <p>
          Carregando ficha técnica...
        </p>
      </div>
    `;

  try {

    const {
      data: recipe,
      error
    } =
      await supabaseClient
        .from(
          'product_ingredients'
        )
        .select(
          'ingredient_id, quantity'
        )
        .eq(
          'product_id',
          product.id
        );

    if (error) {

      throw error;
    }

    const recipeMap =
      new Map(
        (
          recipe ||
          []
        )
          .map(
            item => [
              String(
                item.ingredient_id
              ),
              safeNumber(
                item.quantity
              )
            ]
          )
      );

    if (
      ingredients.length ===
      0
    ) {

      container.innerHTML =
        `
          <div class="empty-state small">

            <strong>
              Nenhum insumo cadastrado
            </strong>

            <p>
              Cadastre insumos antes de montar a ficha técnica.
            </p>

          </div>
        `;

      calculateRecipeCost();

      return;
    }

    container.innerHTML =
      ingredients
        .map(
          ingredient => {

            const quantity =
              recipeMap.get(
                String(
                  ingredient.id
                )
              ) ||
              0;

            return `

              <div
                class="recipe-row"
                data-recipe-ingredient="${ingredient.id}"
              >

                <div class="recipe-ingredient">

                  <strong>
                    ${escapeHtml(
                      ingredient.name
                    )}
                  </strong>

                  <span>
                    Custo:
                    ${formatMoney(
                      ingredient.average_cost
                    )}
                    /
                    ${escapeHtml(
                      formatUnit(
                        ingredient.unit
                      )
                    )}
                  </span>

                </div>


                <div class="recipe-quantity">

                  <input
                    type="number"
                    min="0"
                    step="0.001"
                    value="${quantity}"
                    data-recipe-quantity="${ingredient.id}"
                  >

                  <span>
                    ${escapeHtml(
                      formatUnit(
                        ingredient.unit
                      )
                    )}
                  </span>

                </div>


                <div class="recipe-cost">

                  <span>
                    Custo
                  </span>

                  <strong
                    data-recipe-cost="${ingredient.id}"
                  >
                    R$ 0,00
                  </strong>

                </div>

              </div>

            `;
          }
        )
        .join('');

    container
      .querySelectorAll(
        '[data-recipe-quantity]'
      )
      .forEach(
        input => {

          input.addEventListener(
            'input',
            calculateRecipeCost
          );
        }
      );

    calculateRecipeCost();

  } catch (error) {

    console.error(
      error
    );

    container.innerHTML =
      `
        <div class="empty-state small">
          <p>
            Não foi possível carregar a ficha técnica.
          </p>
        </div>
      `;
  }
}


/* =========================================================
   CUSTO DA FICHA
========================================================= */

function calculateRecipeCost() {

  let total =
    0;

  ingredients.forEach(
    ingredient => {

      const input =
        document.querySelector(
          `[data-recipe-quantity="${ingredient.id}"]`
        );

      if (!input) {

        return;
      }

      const quantity =
        safeNumber(
          input.value
        );

      const cost =
        quantity *
        safeNumber(
          ingredient.average_cost
        );

      total +=
        cost;

      const costLabel =
        document.querySelector(
          `[data-recipe-cost="${ingredient.id}"]`
        );

      if (costLabel) {

        costLabel.textContent =
          formatMoney(
            cost
          );
      }
    }
  );

  byId(
    'recipeCalculatedCost'
  ).textContent =
    formatMoney(
      total
    );

  return roundCost(
    total
  );
}


/* =========================================================
   SALVAR FICHA
========================================================= */

async function saveRecipe() {

  if (savingRecipe) {

    return;
  }

  const productId =
    String(
      byId(
        'recipeProductId'
      ).value ||
      ''
    );

  if (!productId) {

    return;
  }

  const message =
    byId(
      'recipeFormMessage'
    );

  const button =
    byId(
      'btnSaveRecipe'
    );

  const rows = [];

  ingredients.forEach(
    ingredient => {

      const input =
        document.querySelector(
          `[data-recipe-quantity="${ingredient.id}"]`
        );

      const quantity =
        safeNumber(
          input?.value
        );

      if (
        quantity > 0
      ) {

        rows.push(
          {

            product_id:
              Number(
                productId
              ),

            ingredient_id:
              ingredient.id,

            quantity:
              quantity,

            updated_at:
              new Date()
                .toISOString()

          }
        );
      }
    }
  );

  try {

    savingRecipe =
      true;

    button.disabled =
      true;

    button.textContent =
      'Salvando...';

    showMessage(
      message,
      'Salvando ficha técnica...',
      'warning'
    );

    /*
     * Remove a ficha anterior.
     */

    const {
      error:
        deleteError
    } =
      await supabaseClient
        .from(
          'product_ingredients'
        )
        .delete()
        .eq(
          'product_id',
          productId
        );

    if (deleteError) {

      throw deleteError;
    }

    if (
      rows.length > 0
    ) {

      const {
        error:
          insertError
      } =
        await supabaseClient
          .from(
            'product_ingredients'
          )
          .insert(
            rows
          );

      if (insertError) {

        throw insertError;
      }
    }

    const calculatedCost =
      calculateRecipeCost();

    /*
     * Atualiza o custo atual do produto
     * baseado na ficha técnica.
     */

    const {
      error:
        productError
    } =
      await supabaseClient
        .from('products')
        .update(
          {

            average_cost:
              calculatedCost,

            updated_at:
              new Date()
                .toISOString()

          }
        )
        .eq(
          'id',
          productId
        );

    if (productError) {

      throw productError;
    }

    showMessage(
      message,
      `Ficha salva. Custo atual: ${formatMoney(
        calculatedCost
      )}`,
      'success'
    );

    await loadProducts();

    setTimeout(
      () => {

        closeModal(
          byId(
            'recipeModal'
          )
        );

      },
      550
    );

  } catch (error) {

    console.error(
      'Erro ao salvar ficha:',
      error
    );

    showMessage(
      message,
      'Não foi possível salvar a ficha técnica.'
    );

  } finally {

    savingRecipe =
      false;

    button.disabled =
      false;

    button.textContent =
      'Salvar ficha técnica';
  }
}


/* =========================================================
   RECALCULAR PRODUTOS APÓS MUDANÇA DE INSUMO
========================================================= */

async function recalculateProductsUsingIngredient(
  ingredientId
) {

  try {

    const {
      data: links,
      error
    } =
      await supabaseClient
        .from(
          'product_ingredients'
        )
        .select(
          'product_id'
        )
        .eq(
          'ingredient_id',
          ingredientId
        );

    if (
      error ||
      !links?.length
    ) {

      return;
    }

    const productIds =
      [
        ...new Set(
          links.map(
            item =>
              item.product_id
          )
        )
      ];

    for (
      const productId
      of productIds
    ) {

      await recalculateSingleProductCost(
        productId
      );
    }

  } catch (error) {

    console.error(
      'Erro ao recalcular produtos:',
      error
    );
  }
}


/* =========================================================
   RECALCULAR UM PRODUTO
========================================================= */

async function recalculateSingleProductCost(
  productId
) {

  const {
    data: recipe,
    error
  } =
    await supabaseClient
      .from(
        'product_ingredients'
      )
      .select(
        `
        quantity,
        ingredients:ingredient_id (
          average_cost
        )
        `
      )
      .eq(
        'product_id',
        productId
      );

  if (error) {

    console.error(
      error
    );

    return;
  }

  let total =
    0;

  (
    recipe ||
    []
  )
    .forEach(
      row => {

        total +=
          (
            safeNumber(
              row.quantity
            ) *
            safeNumber(
              row.ingredients
                ?.average_cost
            )
          );
      }
    );

  await supabaseClient
    .from('products')
    .update(
      {

        average_cost:
          roundCost(
            total
          ),

        updated_at:
          new Date()
            .toISOString()

      }
    )
    .eq(
      'id',
      productId
    );
}


/* =========================================================
   EVENTOS
========================================================= */

function configureEvents() {

  byId(
    'btnProductsLogout'
  )?.addEventListener(
    'click',
    logoutMaster
  );


  byId(
    'btnRefreshProducts'
  )?.addEventListener(
    'click',
    async () => {

      const button =
        byId(
          'btnRefreshProducts'
        );

      button.disabled =
        true;

      button.textContent =
        '⏳ Atualizando...';

      try {

        await loadProducts();

      } finally {

        button.disabled =
          false;

        button.textContent =
          '🔄 Atualizar';
      }
    }
  );


  byId(
    'btnNewProduct'
  )?.addEventListener(
    'click',
    openNewProduct
  );


  byId(
    'productForm'
  )?.addEventListener(
    'submit',
    saveProduct
  );


  byId(
    'stockForm'
  )?.addEventListener(
    'submit',
    saveStockEntry
  );


  byId(
    'btnSaveRecipe'
  )?.addEventListener(
    'click',
    saveRecipe
  );


  document
    .querySelectorAll(
      'input[name="itemType"]'
    )
    .forEach(
      radio => {

        radio.addEventListener(
          'change',
          updateFormByType
        );
      }
    );


  byId(
    'stockEntryQuantity'
  )?.addEventListener(
    'input',
    calculateStockPreview
  );


  byId(
    'stockEntryUnitCost'
  )?.addEventListener(
    'input',
    calculateStockPreview
  );


  byId(
    'productsSearch'
  )?.addEventListener(
    'input',
    event => {

      currentSearch =
        event.target.value ||
        '';

      renderProducts();
    }
  );


  document
    .querySelectorAll(
      '.filter-btn'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            document
              .querySelectorAll(
                '.filter-btn'
              )
              .forEach(
                item => {

                  item.classList.remove(
                    'active'
                  );
                }
              );

            button.classList.add(
              'active'
            );

            currentFilter =
              button.dataset.filter ||
              'all';

            renderProducts();
          }
        );
      }
    );


  byId(
    'productsList'
  )?.addEventListener(
    'click',
    event => {

      const editButton =
        event.target.closest(
          '[data-edit]'
        );

      if (editButton) {

        openEditProduct(
          editButton.dataset.edit
        );

        return;
      }


      const stockButton =
        event.target.closest(
          '[data-stock]'
        );

      if (stockButton) {

        openStockEntry(
          stockButton.dataset.stock
        );

        return;
      }


      const recipeButton =
        event.target.closest(
          '[data-recipe]'
        );

      if (recipeButton) {

        openRecipe(
          recipeButton.dataset.recipe
        );
      }
    }
  );


  document
    .querySelectorAll(
      '[data-close-modal]'
    )
    .forEach(
      button => {

        button.addEventListener(
          'click',
          () => {

            closeModalByName(
              button.dataset
                .closeModal
            );
          }
        );
      }
    );


  document.addEventListener(
    'keydown',
    event => {

      if (
        event.key !==
        'Escape'
      ) {

        return;
      }

      const modal =
        document.querySelector(
          '.modal:not(.hidden)'
        );

      if (modal) {

        closeModal(
          modal
        );
      }
    }
  );
}


/* =========================================================
   MONITORAR AUTH
========================================================= */

function watchAuth() {

  supabaseClient.auth
    .onAuthStateChange(
      (
        event,
        session
      ) => {

        if (
          event ===
            'SIGNED_OUT' ||
          !session
        ) {

          window.location.href =
            'master-login.html';
        }
      }
    );
}


/* =========================================================
   INIT
========================================================= */

async function initProductsPage() {

  const allowed =
    await validateMasterAccess();

  if (!allowed) {

    return;
  }

  configureEvents();

  watchAuth();

  await loadProducts();

  byId(
    'productsLoading'
  ).style.display =
    'none';

  byId(
    'productsApp'
  ).classList.remove(
    'hidden'
  );
}


/* =========================================================
   START
========================================================= */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initProductsPage()
      .catch(
        error => {

          console.error(
            'Erro ao iniciar Produtos:',
            error
          );

          alert(
            'Não foi possível abrir Produtos e Insumos.'
          );
        }
      );
  }
);
